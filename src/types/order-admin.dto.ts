import { OrderStatusEnum } from "../../generated/prisma/enums";

export interface GetAllOrderAdminDTO {
  page: number;
  limit: number;
  search?: string;
  outletId?: string;
  orderStatus?: OrderStatusEnum;
  workerId?: string;
  startDate?: string;
  endDate?: string;
}

export interface OrderItemInput {
  laundryItemId: string;
  quantity: number;
}

export interface ProcessOrderDTO {
  totalWeight: number;
  orderItems: OrderItemInput[];
  workerId: string;
}

export interface CreateManualOrderDTO {
  customerId: string;
  totalWeight: number;
  orderItems: OrderItemInput[];
  workerId: string;
}

export interface UpdateOrderStatusDTO {
  status: OrderStatusEnum;
  workerId: string;
}
