import { prisma } from "../../config/prisma-client.config";
import AppError from "../../helpers/app-error.helper";
import { RegisterEmployeeDTO, UpdateEmployeeDTO } from "../../types/auth.dto";
import { hashing } from "../../helpers/bcrypt.helper";
import path from "node:path";
import fs from "fs";
import Handlebars from "handlebars";
import transporter from "../../helpers/nodemailer.helper";
import { jwtCreateToken } from "../../helpers/jwt.helper";
import { JWT_ACCOUNT_ACTIOVATION_SECRET_KEY, POS_APP_URL } from "../../config/main.config";

export const superAdminService = {
  async register(data: RegisterEmployeeDTO) {
    // Only validate outlet if outletId is provided (non-super_admin roles need it)
    if (data.outletId) {
      const outlet = await prisma.outlet.findUnique({
        where: { id: data.outletId, deletedAt: null },
      });
      if (!outlet) throw AppError("Outlet not found", 404);
    } else if (data.role !== "super_admin") {
      // Non-super_admin roles require an outlet
      throw AppError("Outlet ID is required for this role", 400);
    }

    const existingEmployee = await prisma.employee.findFirst({
      where: {
        OR: [{ email: data.email }, { identityNumber: data.identityNumber }],
        deletedAt: null,
      },
    });

    if (existingEmployee) {
      if (existingEmployee.email === data.email) {
        throw AppError("Email is already registered", 409);
      }
      throw AppError("Identity number is already registered", 409);
    }

    const hashedPassword = await hashing(data.password);

    const createData: any = {
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      phoneNumber: data.phoneNumber,
      password: hashedPassword,
      role: data.role,
      identityNumber: data.identityNumber,
      bankAccountNumber: data.bankAccountNumber,
    };
    if (data.outletId) createData.outletId = data.outletId;

    const employee = await prisma.employee.create({
      data: createData,
    });

    // --- EMAIL VERIFICATION LOGIC ---
    const activationToken = await jwtCreateToken(
      { employeeId: employee.id },
      JWT_ACCOUNT_ACTIOVATION_SECRET_KEY!,
      { expiresIn: "1d" }
    );

    const templateDir = path.resolve(__dirname, "../../templates");
    const templatePath = path.join(templateDir, "email-templates.html");
    const templateSource = fs.readFileSync(templatePath, "utf-8");
    const compiledTemplate = Handlebars.compile(templateSource);

    const html = compiledTemplate({
      email: employee.email,
      activationLink: `${POS_APP_URL}/auth-employee/verify/${activationToken}`,
      greeting: `Welcome, ${employee.firstName}! 👔`,
      description:
        "An account has been created for you at dilaundryin. To activate your account and verify your email, please click the button below.",
      cta: "Verify & Activate Account",
      expired: "24 hours",
    });

    await transporter.sendMail({
      to: employee.email,
      subject: "Employee Account Activation",
      html: html,
    }).catch(err => {
      console.error("Failed to send verification email:", err);
      // We don't throw error here to not roll back registration, 
      // but in production we might want to handle this better.
    });
    // --------------------------------

    // Fetch outlet name separately if outletId exists
    let outletName: string | null = null;
    if (employee.outletId) {
      const outlet = await prisma.outlet.findUnique({ where: { id: employee.outletId } });
      outletName = outlet?.name || null;
    }

    return {
      id: employee.id,
      firstName: employee.firstName,
      lastName: employee.lastName,
      email: employee.email,
      role: employee.role,
      outletId: employee.outletId,
      outletName,
    };
  },

  async getEmployees(query: {
    role?: string;
    outletId?: string;
    search?: string;
    page?: number;
    limit?: number;
  }) {
    const { role, outletId, search, page = 1, limit = 10 } = query;
    const skip = (page - 1) * limit;

    const where: any = {
      deletedAt: null,
    };

    if (role) where.role = role;
    if (outletId) where.outletId = outletId;
    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: "insensitive" } },
        { lastName: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
      ];
    }

    const [employees, total] = await Promise.all([
      prisma.employee.findMany({
        where,
        include: { outlet: true },
        skip,
        take: Number(limit),
        orderBy: { createdAt: "desc" },
      }),
      prisma.employee.count({ where }),
    ]);

    return {
      employees: employees.map((emp) => ({
        id: emp.id,
        firstName: emp.firstName,
        lastName: emp.lastName,
        email: emp.email,
        role: emp.role,
        outletId: emp.outletId,
        outletName: emp.outlet?.name || null,
        profilePicture: emp.profilePicture,
        phoneNumber: emp.phoneNumber,
        identityNumber: emp.identityNumber,
        bankAccountNumber: emp.bankAccountNumber,
      })),
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  },

  async getEmployeeById(id: string) {
    const employee = await prisma.employee.findUnique({
      where: { id, deletedAt: null },
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
      phoneNumber: employee.phoneNumber,
      identityNumber: employee.identityNumber,
      bankAccountNumber: employee.bankAccountNumber,
    };
  },

  async deleteEmployee(id: string) {
    const employee = await prisma.employee.findUnique({
      where: { id, deletedAt: null },
    });

    if (!employee) throw AppError("Employee not found", 404);

    await prisma.employee.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    return {
      message: "Employee deleted successfully",
    };
  },

  async updateEmployee(id: string, data: UpdateEmployeeDTO) {
    const employee = await prisma.employee.findUnique({
      where: { id, deletedAt: null },
    });

    if (!employee) throw AppError("Employee not found", 404);

    const updateData: any = { ...data };
    if (data.password) {
      updateData.password = await hashing(data.password);
    }

    const updatedEmployee = await prisma.employee.update({
      where: { id },
      data: updateData,
      include: { outlet: true },
    });

    return {
      id: updatedEmployee.id,
      firstName: updatedEmployee.firstName,
      lastName: updatedEmployee.lastName,
      email: updatedEmployee.email,
      role: updatedEmployee.role,
      outletId: updatedEmployee.outletId,
      outletName: updatedEmployee.outlet?.name || null,
      profilePicture: updatedEmployee.profilePicture,
      phoneNumber: updatedEmployee.phoneNumber,
      identityNumber: updatedEmployee.identityNumber,
      bankAccountNumber: updatedEmployee.bankAccountNumber,
    };
  },

  async getDashboardStats() {
    const [totalOutlets, totalEmployees, totalOrders] = await Promise.all([
      prisma.outlet.count({ where: { deletedAt: null } }),
      prisma.employee.count({ where: { deletedAt: null } }),
      prisma.order.count({ where: { deletedAt: null } }),
    ]);

    return {
      totalOutlets,
      totalEmployees,
      activeOrders: totalOrders,
    };
  },
};
