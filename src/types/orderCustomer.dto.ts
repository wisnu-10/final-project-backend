import { OrderStatusEnum, PaymentStatus } from "../../generated/prisma/enums";

export interface CreateOrderPickupDTO {
  scheduleTime: Date
  pickupAddressId: string
  deliveryAddressId: string
}

export interface GetAllOrderDTO {
  page: number;
  limit: number;
  search?: string;
  paymentStatus?: PaymentStatus;
  orderStatus?: OrderStatusEnum
  sortOrder?: "asc" | "desc";
  startDate?: string;
  endDate?: string;
}
