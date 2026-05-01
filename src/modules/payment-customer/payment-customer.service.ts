import path from "node:path";
import { PaymentMethod, PaymentStatus } from "../../../generated/prisma/enums";
import { snap } from "../../config/midtrans.config";
import { prisma } from "../../config/prisma-client.config";
import AppError from "../../helpers/app-error.helper";
import fs from "fs";
import transporter from "../../helpers/nodemailer.helper";
import Handlebars from "handlebars";

export const paymentCustomerService = {
  async createPayment(orderId: string) {
    const order = await prisma.order.findUnique({
      where: {
        id: orderId,
      },
      include: {
        customer: true,
        orderItems: { include: { laundryItem: true } },
        outlet: true,
        pickupAddress: true,
      },
    });

    if (!order) throw AppError("Order not found", 404);

    const allItems = [];
    let calculatedGrossAmount = 0;

    order.orderItems.forEach((item) => {
      if (item.laundryItem.pricingType === "per_item") {
        const unitPrice = Number(item.laundryItem.price);
        const qty = item.quantity;
        const itemTotal = unitPrice * qty;

        allItems.push({
          id: item.laundryItem.id,
          price: unitPrice,
          quantity: qty,
          name: `${item.laundryItem.name.substring(0, 30)} (${qty} x ${unitPrice.toLocaleString("id-ID")})`,
        });

        calculatedGrossAmount += itemTotal;
      }
    });

    if (Number(order.totalWeight) > 0) {
      const priceKg = Number(order.pricePerKg);
      const weight = Number(order.totalWeight);
      const kiloanTotal = priceKg * weight;

      allItems.push({
        price: priceKg,
        quantity: weight,

        name: `Basic Wash (${weight}kg x ${priceKg.toLocaleString("id-ID")})`,
      });

      calculatedGrossAmount += kiloanTotal;
    }

    const parameter = {
      transaction_details: {
        order_id: `${order.invoiceNumber}-${Date.now().toString().slice(-5)}`,
        gross_amount: calculatedGrossAmount,
      },
      item_details: allItems,
      customer_details: {
        first_name: order.customer.firstName,
        last_name: order.customer.lastName,
        email: order.customer.email,
        phone: order.customer.phoneNumber,
        billing_address: {
          address: order.pickupAddress.address,
          city: order.pickupAddress.cityName,
          postal_code: order.pickupAddress.postalCode,
        },
      },
    };
    const transaction = await snap.createTransaction(parameter);

    return transaction;
  },

  async handleWebhook(payload: any) {
    const {
      order_id,
      transaction_status,
      fraud_status,
      transaction_id,
      payment_type,
      gross_amount,
    } = payload;

    if (!order_id) {
      throw AppError("Order id not valid", 400);
    }

    let mappedMethod: PaymentMethod | null = null;

    if (payment_type === "bank_transfer" || payment_type === "echannel") {
      mappedMethod = PaymentMethod.bank_transfer;
    } else if (payment_type === "gopay" || payment_type === "shopeepay") {
      mappedMethod = PaymentMethod.ewallet;
    } else if (payment_type === "qris") {
      mappedMethod = PaymentMethod.qris;
    }

    let newPaymentStatus: PaymentStatus = PaymentStatus.pending;

    if (
      transaction_status === "capture" ||
      transaction_status === "settlement"
    ) {
      if (fraud_status === "accept" || !fraud_status) {
        newPaymentStatus = PaymentStatus.paid;
      }
    } else if (
      transaction_status === "cancel" ||
      transaction_status === "deny"
    ) {
      newPaymentStatus = PaymentStatus.failed;
    } else if (transaction_status === "expire") {
      newPaymentStatus = PaymentStatus.expired;
    } else if (transaction_status === "pending") {
      newPaymentStatus = PaymentStatus.pending;
    }

    const actualOrderId = order_id.split("-").slice(0, 3).join("-");

    const orderStatus = await prisma.order.findFirst({
      where: { invoiceNumber: actualOrderId },
      include: { statusLogs: {
        orderBy: { createdAt: 'asc' },
        select: {status: true}} },
    });

    await prisma.$transaction(async (tx) => {
      await tx.payment.updateMany({
        where: {
          order: {
            invoiceNumber: actualOrderId,
          },
        },
        data: {
          status: newPaymentStatus,
          gatewayTransactionId: transaction_id,
          method: mappedMethod,
          paidAt:
            newPaymentStatus === PaymentStatus.paid ? new Date() : undefined,
          amount: gross_amount,
        },
      });

      if (
        orderStatus?.statusLogs[orderStatus?.statusLogs?.length - 1]?.status ===
          "waiting_payment" &&
        newPaymentStatus === PaymentStatus.paid
      ) {
        await tx.order.update({
          where: { invoiceNumber: actualOrderId },
          data: { statusLogs: { create: { status: "ready_delivery" } } },
        });
      }
    });
  },

  async emailInvoice(orderId: string) {
    const existingOrder = await prisma.order.findFirst({
      where: {
        id: orderId,
      },
      include: {
        outlet: true,
        payments: { select: { status: true } },
        orderItems: { include: { laundryItem: true } },
        customer: true,
      },
    });

    if (!existingOrder) throw AppError("Order not found", 404);

    const kiloan = existingOrder.orderItems
      .filter((items: any) => items.laundryItem.pricingType === "kiloan")
      .map((items: any) => ({
        name: "Basic Wash",
        detail: `${existingOrder.totalWeight} kg x Rp. ${Number(existingOrder.pricePerKg).toLocaleString("id-ID")}`,
        subTotal: (
          Number(existingOrder.totalWeight) * Number(existingOrder.pricePerKg)
        ).toLocaleString("id-ID"),
      }));

    const perItems = existingOrder.orderItems
      .filter((items: any) => items.laundryItem.pricingType === "per_item")
      .map((items: any) => ({
        name: items.laundryItem.name,
        detail: `${items.quantity} kg x Rp. ${Number(items.laundryItem.price)}`,
        subTotal: Number(items.subTotal).toLocaleString("id-ID"),
      }));

    const templateDir = path.resolve(__dirname, "../../templates");

    const templatePath = path.join(templateDir, "invoice-templates.html");

    const templateSource = fs.readFileSync(templatePath, "utf-8");

    const compiledTemplate = Handlebars.compile(templateSource);

    const html = compiledTemplate({
      firstName: existingOrder.customer.firstName,
      lastName: existingOrder.customer.lastName,
      customerPhone: existingOrder.customer.phoneNumber,
      invoiceNumber: existingOrder.invoiceNumber,
      orderDate: new Date(existingOrder.createdAt).toLocaleDateString("id-ID", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }),
      paymentStatus:
        existingOrder.payments[existingOrder.payments.length - 1].status,
      outletName: existingOrder.outlet.name,
      outletAddress: existingOrder.outlet.address,
      outletCity: existingOrder.outlet.cityName,
      outletProvince: existingOrder.outlet.provinceName,
      hasKiloan: kiloan.length > 0,
      kiloan: kiloan,
      hasPerItem: perItems.length > 0,
      perItems: perItems,
      totalPrice: Number(existingOrder.totalPrice).toLocaleString("id-ID"),
    });

    await transporter.sendMail({
      to: existingOrder.customer.email,
      subject: `Payment Invoice ${existingOrder.invoiceNumber} - diLaundryin`,
      html: html,
    });
  },
};
