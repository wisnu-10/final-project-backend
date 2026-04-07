import { prisma } from "../../config/prisma-client.config";
import AppError from "../../helpers/app-error.helper";
import { LoginDTO } from "../../types/auth.dto";
import { jwtCreateToken } from "../../helpers/jwt.helper";
import { JWT_TOKEN_SECRET_KEY } from "../../config/main.config";
import { hashMatch } from "../../helpers/bcrypt.helper";

export const authEmployeeService = {
  async login({ email, password }: LoginDTO) {
    const employee = await prisma.employee.findUnique({
      where: { email, deletedAt: null },
      include: { outlet: true },
    });

    if (!employee) throw AppError("Invalid email or password", 401);

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
};

