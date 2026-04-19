import { Request, Response } from "express";
import { paymentCustomerService } from "./payment-customer.service";

export const paymentCustomerController = {
    async createPayment(req: Request, res: Response){    
        const { orderId } = req.body

        const transaction = await paymentCustomerService.createPayment(orderId)

        res.status(201).json({
          success: true,
          message: "Create payment successfully",
          data: transaction,
          token: transaction.token,
          redirect_url: transaction.redirect_url
        });

    },

    async handleWebhook(req: Request, res: Response){
        const {
          order_id,
          transaction_status,
          fraud_status,
          transaction_id,
          payment_type,
        } = req.body;

        const result = await paymentCustomerService.handleWebhook({
          order_id,
          transaction_status,
          fraud_status,
          transaction_id,
          payment_type,
        });

        res.status(200).json({
            success: true,
            message: "Webhook received",
            data: result
        })
    }
}