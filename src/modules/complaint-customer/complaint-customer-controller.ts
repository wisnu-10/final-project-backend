import { Request, Response } from "express";
import { CreateComplaintDTO } from "../../types/complaint.dto";
import { complaintCustomerService } from "./complaint-customer-service";

export const complaintCustomerController = {
    async createComplaint(req: Request, res: Response) {
        const {customerId} = res.locals.payload;

        const complaint = req.body as CreateComplaintDTO

        await complaintCustomerService.createComplaint(customerId, complaint);

        res.status(200).json({
            success: true,
            message: "Create complaint success",
            data: complaint
        })
    },

    async getComplaints(req: Request, res: Response) {
        const {employeeId} = res.locals.payload;

        const complaints =
          await complaintCustomerService.getComplaints(employeeId);

        res.status(200).json({
            success: true,
            message: "Get complaints success",
            data: complaints
        })
    },

    async getCompaintById(req: Request, res: Response){
        const {employeeId} = res.locals.payload

        const {id} = req.params

        const complaint = await complaintCustomerService.getComplainById(employeeId, id as string)

        res.status(200).json({
            success: true,
            message: "Get complaint success",
            data: complaint
        })
    }
}
