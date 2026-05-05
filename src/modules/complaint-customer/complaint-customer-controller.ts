import { Request, Response } from "express";
import { CreateComplaintDTO, GetComplaintsDTO, ResolveComplaintDTO } from "../../types/complaint.dto";
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
        const { search, status, outletId } = req.query;

        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;

        const result = await complaintCustomerService.getComplaints(employeeId, {
            page,
            limit,
            search: search as string,
            status: status as string,
            outletId: outletId as string
        });

        res.status(200).json({
            success: true,
            message: "Get complaints success",
            data: result
        })
    },

    async getComplaintById(req: Request, res: Response){
        const {employeeId} = res.locals.payload

        const {id} = req.params

        const complaint = await complaintCustomerService.getComplaintById(employeeId, id as string)

        res.status(200).json({
            success: true,
            message: "Get complaint success",
            data: complaint
        })
    },

    async resolveComplaint(req: Request, res: Response) {
        const { employeeId } = res.locals.payload;
        const { id } = req.params;
        const body = req.body as ResolveComplaintDTO;

        const result = await complaintCustomerService.resolveComplaint(employeeId, id as string, body);

        res.status(200).json({
            success: true,
            message: `Complaint ${body.status} successfully`,
            data: result
        });
    }
}
