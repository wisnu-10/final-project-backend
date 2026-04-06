import path from "node:path";
import { prisma } from "../../config/prisma-client.config";
import AppError from "../../helpers/app-error.helper";
import { hashing, hashMatch } from "../../helpers/bcrypt.helper";
import { cloudinaryUpload } from "../../helpers/claudinary.helper";
import { ProfileUpdateDTO } from "../../types/profileCustomer.dto";
import fs from "fs";
import transporter from "../../helpers/nodemailer.helper";
import {
  JWT_UPDATE_EMAIL_SECRET_KEY,
  JWT_UPDATE_PASSWORD_SECRET_KEY,
  POS_APP_URL,
} from "../../config/main.config";
import { jwtCreateToken } from "../../helpers/jwt.helper";
import jwt from "jsonwebtoken";
import Handlebars from "handlebars";

export const profileCustomerService = {
  async getProfile(customerId: string) {
    const customer = await prisma.customer.findUnique({
      where: {
        id: customerId,
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phoneNumber: true,
        profilePicture: true,
        isVerified: true,
        createdAt: true,
      },
    });

    return customer;
  },

  async updateProfile(
    customerId: string,
    profilePicture: Express.Multer.File,
    { firstName, lastName, phoneNumber }: ProfileUpdateDTO,
  ) {
    let profilePictureUrl: string | null;

    if (profilePicture) {
      const uploaded = await cloudinaryUpload(profilePicture.buffer);
      profilePictureUrl = uploaded.secureUrl;
    }

    await prisma.$transaction(async (tx) => {
      await tx.customer.update({
        where: {
          id: customerId,
        },
        data: {
          firstName,
          lastName,
          phoneNumber,
          profilePicture: profilePictureUrl,
        },
      });

      await tx.customer.update({
        where: {
          id: customerId,
        },
        data: {
          firstName,
          lastName,
          phoneNumber,
          profilePicture: profilePictureUrl,
        },
      });
    });
    return { customerId, firstName, lastName, phoneNumber };
  },

  async updateEmail(customerId: string, newEmail: string) {
    const findCustomerById = await prisma.customer.findUnique({
      where: {
        id: customerId,
      },
    });

    if (!findCustomerById) throw AppError("Account not found", 400);

    const existingEmailCustomer = await prisma.customer.findUnique({
      where: {
        email: newEmail,
      },
    });

    if (existingEmailCustomer)
      throw AppError("Email is already registerd", 401);

    const templateDir = path.resolve(__dirname, "../../templates");

    const templatePath = path.join(templateDir, "email-templates.html");

    const templateSource = fs.readFileSync(templatePath, "utf-8");

    const compiledTemplate = Handlebars.compile(templateSource);

    const token = await jwtCreateToken(
      { customerId, newEmail },
      JWT_UPDATE_EMAIL_SECRET_KEY!,
      { expiresIn: "15m" },
    );

    const html = compiledTemplate({
      email: newEmail,
      activationLink: `${POS_APP_URL}/profile/confirm-email/${token}`,
      greeting: "Verify Your New Email Address 🛡️",
      description:
        "You're almost there! We received a request to change your diLaundryin account email. Please click the button below to verify this new address and complete the update.",
      cta: "Verify & Update Email",
      expired: "15 minutes",
    });

    await transporter.sendMail({
      to: newEmail,
      subject: "Verify Change Email",
      html: html,
    });
  },

  async confirmEmail(token: string) {
    if (!token) throw AppError("token not found", 400);

    const payload = jwt.verify(token, JWT_UPDATE_EMAIL_SECRET_KEY!) as {
      customerId: string;
      newEmail: string;
    };

    const existingEmailCustomer = await prisma.customer.findUnique({
      where: {
        email: payload.newEmail,
      },
    });

    if (existingEmailCustomer)
      throw AppError("Email is already registerd", 401);

    await prisma.customer.update({
      where: {
        id: payload.customerId,
      },
      data: { email: payload.newEmail, isVerified: true },
    });
  },

  async verifyPassword(customerId: string, oldPassword: string) {
    const findCustomerById = await prisma.customer.findUnique({
      where: {
        id: customerId,
      },
    });

    if (!findCustomerById) throw AppError("Account not found", 400);

    if (findCustomerById.password === null)
      throw AppError("Invalid email or password", 401);

    const passwordMatch = await hashMatch(
      oldPassword,
      findCustomerById.password,
    );

    if (!passwordMatch) throw AppError("Invalid email or password", 401);

    const token = jwtCreateToken(
      { customerId: findCustomerById.id, role: findCustomerById.role },
      JWT_UPDATE_PASSWORD_SECRET_KEY!,
      { expiresIn: "15m" },
    );

    return { token };
  },

  async updatePassword(
    customerId: string,
    newPassword: string,
  ) {
    const findCustomerById = await prisma.customer.findUnique({
      where: {
        id: customerId,
      },
    });

    if (!findCustomerById) throw AppError("Account not found", 400);

    if (findCustomerById.password === null)
      throw AppError("Invalid email or password", 401);

    const hashedPassword = await hashing(newPassword);

    await prisma.customer.update({
      where: {
        id: customerId,
      },
      data: {
        password: hashedPassword,
      },
    });
  },
};
