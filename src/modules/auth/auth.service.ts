import path from "node:path";
import { jwtCreateToken } from "../../helpers/jwt.helper";
import {
  JWT_ACCOUNT_ACTIOVATION_SECRET_KEY,
  JWT_RESET_PASSWORD,
  JWT_TOKEN_SECRET_KEY,
  POS_APP_URL,
} from "../../config/main.config";
import { prisma } from "../../config/prisma-client.config";
import AppError from "../../helpers/app-error.helper";
import { LoginDTO, RegisterDTO } from "../../types/auth.dto";
import fs from "fs";
import transporter from "../../helpers/nodemailer.helper";
import Handlebars from "handlebars";
import jwt from "jsonwebtoken";
import { hashing, hashMatch } from "../../helpers/bcrypt.helper";
import { addMinutes } from "date-fns";
import { profile } from "node:console";

export const authService = {
  async register({
    firstName,
    lastName,
    email,
    phoneNumber,
    role,
  }: RegisterDTO) {
    const existingEmailCustomer = await prisma.customer.findUnique({
      where: {
        email,
      },
    });

    if (existingEmailCustomer) {
      if (existingEmailCustomer.password === null) {
        await prisma.customer.delete({ where: { email } });
      } else {
        throw AppError("Email already registered and active", 409);
      }
    }

    const createdCustomer = await prisma.customer.create({
      data: {
        firstName,
        lastName,
        email,
        phoneNumber,
        role,
      },
    });

    const activationToken = await jwtCreateToken(
      { customerId: createdCustomer.id },
      JWT_ACCOUNT_ACTIOVATION_SECRET_KEY!,
      { expiresIn: "1d" },
    );

    const templateDir = path.resolve(__dirname, "../../templates");

    const templatePath = path.join(templateDir, "email-templates.html");

    const templateSource = fs.readFileSync(templatePath, "utf-8");

    const compiledTemplate = Handlebars.compile(templateSource);

    const html = compiledTemplate({
      email: email,
      activationLink: `${POS_APP_URL}/auth/activation-password/${activationToken}`,
      greeting: "Welcome Anak Baik! 🧺",
      description:
        "Thanks for joining dilaundryin! We're excited to help you keep your clothes fresh and clean. To get started, you just need to set up your password and activate your account.",
      cta: "Setup Password & Activate",
      expired: "1 hour",
    });

    await transporter.sendMail({
      to: email,
      subject: "Account Activation",
      html: html,
    });
  },

  async activation(password: string, token: string) {
    if (!token) throw AppError("token not found", 400);

    const payload = jwt.verify(token, JWT_ACCOUNT_ACTIOVATION_SECRET_KEY!) as {
      customerId: string;
    };
 
    const hashedPassword = await hashing(password);

    await prisma.customer.update({
      data: {
        password: hashedPassword,
        isVerified: true,
      },
      where: {
        id: payload.customerId,
      },
    });
  },

  async login({ email, password }: LoginDTO) {
    const findCustomerByEmail = await prisma.customer.findUnique({
      where: {
        email,
      },
    });

    if (!findCustomerByEmail) throw AppError("Invalid email or password", 401);

    if (findCustomerByEmail.password === null)
      throw AppError("Invalid email or password", 401);

    const passwordMatch = await hashMatch(password, findCustomerByEmail.password);

    if (!passwordMatch) throw AppError("Invalid email or password", 401);

    const token = jwtCreateToken(
      {
        customerId: findCustomerByEmail.id,
        role: findCustomerByEmail.role,
      },
      JWT_TOKEN_SECRET_KEY!,
      { expiresIn: "1d" },
    );

    return {
      id: findCustomerByEmail.id,
      email: findCustomerByEmail.email,
      role: findCustomerByEmail.role,
      token: token,
      firstName: findCustomerByEmail.firstName,
      profilePicture: findCustomerByEmail?.profilePicture,
    };
  },

  async session(customerId: string) {
    const findUserById = await prisma.customer.findUnique({
      where: {
        id: customerId,
      },
    });

    return {
      firstName: findUserById?.firstName,
      email: findUserById?.email,
      role: findUserById?.role,
      profilePicture: findUserById?.profilePicture
    };
  },

  async forgotPassword(email: string) {
    const findEmail = await prisma.customer.findUnique({
      where: {
        email,
      },
    });

    if (!findEmail) throw AppError("email not registered", 400);

    const resetToken = await jwtCreateToken(
      { customerId: findEmail.id },
      JWT_RESET_PASSWORD!,
      {
        expiresIn: "15m",
      },
    );

    const templateDir = path.resolve(__dirname, "../../templates");

    const templatePath = path.join(templateDir, "email-templates.html");

    const templateSource = fs.readFileSync(templatePath, "utf-8");

    const compiledTemplate = Handlebars.compile(templateSource);

    const html = compiledTemplate({
      email: email,
      activationLink: `${POS_APP_URL}/auth/reset-password/${resetToken}`,
      greeting: "Reset Your Password 🔑",
      description:
        "We received a request to reset the password for your dilaundryin account. No worries—it happens to the best of us! Click the button below to choose a new password.",
      cta: "Reset My Password",
      expired: "15 minute",
    });

    await transporter.sendMail({
      to: email,
      subject: "Reset Password",
      html: html,
    });
  },

  async resetPassword(token: string, password: string) {
    if (!token) throw AppError("token not found", 400);


    const payload = jwt.verify(token, JWT_RESET_PASSWORD!) as {
      customerId: string;
    };

    const usedToken = await prisma.token.findFirst({
      where: { token, isUsed: true },
    });

    if (usedToken) throw AppError("Token expired or already used", 400);

    const hashedPassword = await hashing(password);

    const account = await prisma.customer.update({
      where: {
        id: payload.customerId,
      },
      data: {
        password: hashedPassword,
        tokens: {
          create: [
            {
              type: "RESET_PASSWORD",
              token: token,
              isUsed: true,
              expiresAt: addMinutes(new Date(), 15),
            },
          ],
        },
      },
    });

    return {
      email: account.email,
    };
  },

  async authGoogleCallback(userId: string) {
    const user = await prisma.customer.findUnique({
      where: { id: userId },
    });

    if (!user) throw AppError("User not found", 404);

    return jwtCreateToken(
      {
        customerId: userId,
        role: user.role,
      },
      JWT_TOKEN_SECRET_KEY!,
      { expiresIn: "1d" },
    );
  },
};
