import { PaymentMethod, PaymentStatus } from "../../../generated/prisma/enums";
import { snap } from "../../config/midtrans.config";
import { prisma } from "../../config/prisma-client.config";
import AppError from "../../helpers/app-error.helper";

export const paymentCustomerService = {
  async createPayment(orderId: string) {
    const order = await prisma.order.findUnique({
      where: {
        id: orderId,
      },
      include: {
        customer: {
          select: { firstName: true, lastName: true, email: true },
        },
        orderItems: { include: {laundryItem: true}},
      },
    });

    if (!order) throw AppError("Order not found", 404);

    const parameter = {
      transaction_details: {
        order_id: `${order.invoiceNumber}-${Date.now().toString().slice(-5)}`,
        gross_amount: Number(order.totalPrice),
      },
      customer_details: {
        first_name: order.customer.firstName,
        last_name: order.customer.lastName,
        email: order.customer.email,
      },
    };

    const transaction = await snap.createTransaction(parameter);

    return transaction
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

    const actualOrderId = order_id.split("-").slice(0, 3).join("-")

    return await prisma.payment.updateMany({
      where: {
        order: {
          invoiceNumber: actualOrderId
        }
      },
      data: {
        status: newPaymentStatus,
        gatewayTransactionId: transaction_id,
        method: mappedMethod,
        paidAt: newPaymentStatus === PaymentStatus.paid ? new Date() : undefined,
        amount: gross_amount
      },
    });
  }
};
