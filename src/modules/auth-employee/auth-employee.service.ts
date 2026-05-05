import { prisma } from "../../config/prisma-client.config";
import AppError from "../../helpers/app-error.helper";
import { LoginDTO } from "../../types/auth.dto";
import { jwtCreateToken } from "../../helpers/jwt.helper";
import { JWT_ACCOUNT_ACTIOVATION_SECRET_KEY, JWT_TOKEN_SECRET_KEY } from "../../config/main.config";
import { hashMatch } from "../../helpers/bcrypt.helper";
import jwt from "jsonwebtoken";

export const authEmployeeService = {
  async login({ email, password }: LoginDTO) {
    const employee = await prisma.employee.findUnique({
      where: { email, deletedAt: null },
      include: { outlet: true },
    });

    if (!employee) throw AppError("Invalid email or password", 401);

    if (!employee.isVerified) {
      throw AppError("Email not verified. Please check your inbox.", 403);
    }

    const passwordMatch = await hashMatch(password, employee.password);

    if (!passwordMatch) throw AppError("Invalid email or password", 401);

    const token = jwtCreateToken(
      {
        employeeId: employee.id,
        role: employee.role,
        outletId: employee.outletId,
      },
      JWT_TOKEN_SECRET_KEY!,
      { expiresIn: "1d" },
    );

    return {
      id: employee.id,
      email: employee.email,
      role: employee.role,
      token,
      firstName: employee.firstName,
      lastName: employee.lastName,
      outletId: employee.outletId,
      outletName: employee.outlet?.name || null,
    };
  },

  async session(employeeId: string) {
    const employee = await prisma.employee.findUnique({
      where: { id: employeeId, deletedAt: null },
      include: { outlet: true },
    });

    if (!employee) throw AppError("Employee not found", 404);

    return {
      id: employee.id,
      firstName: employee.firstName,
      lastName: employee.lastName,
      email: employee.email,
      role: employee.role,
      outletId: employee.outletId,
      outletName: employee.outlet?.name || null,
      profilePicture: employee.profilePicture,
    };
  },

  async verifyEmail(token: string) {
    if (!token) throw AppError("Token is required", 400);

    try {
      const payload = jwt.verify(token, JWT_ACCOUNT_ACTIOVATION_SECRET_KEY!) as {
        employeeId: string;
      };

      const employee = await prisma.employee.findUnique({
        where: { id: payload.employeeId, deletedAt: null },
      });

      if (!employee) throw AppError("Employee not found", 404);
      if (employee.isVerified) throw AppError("Email already verified", 400);

      await prisma.employee.update({
        where: { id: employee.id },
        data: { isVerified: true },
      });

      return { message: "Email verified successfully" };
    } catch (error: any) {
      if (error.name === "TokenExpiredError") {
        throw AppError("Verification link expired", 400);
      }
      throw AppError("Invalid verification link", 400);
    }
  },
};

