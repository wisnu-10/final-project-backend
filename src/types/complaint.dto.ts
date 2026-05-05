export interface CreateComplaintDTO {
  invoiceNumber: string;
  description: string;
}

export interface GetComplaintsDTO {
  page: number;
  limit: number;
  search?: string;
  status?: string;
  outletId?: string;
}

export interface ResolveComplaintDTO {
  status: 'resolved' | 'rejected';
  adminResponse: string;
}