import { Role } from "../../generated/prisma/client";

export interface RegisterDTO {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  role: Role
}

export interface LoginDTO {
  email: string
  password: string
}

export interface RegisterEmployeeDTO {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  password: string;
  role: "worker" | "driver" | "outlet_admin" | "super_admin";
  outletId?: string;
  identityNumber: string;
  bankAccountNumber: string;
}

export interface UpdateEmployeeDTO {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  role: "worker" | "driver" | "outlet_admin" | "super_admin";
  outletId?: string;
  identityNumber: string;
  bankAccountNumber: string;
}