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