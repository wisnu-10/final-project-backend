# diLaundryin Backend

[![Node.js](https://img.shields.io/badge/Node.js-20-green?style=flat)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=flat)](https://www.typescriptlang.org/)
[![Prisma](https://img.shields.io/badge/Prisma-ORM-%23455A64?style=flat)](https://www.prisma.io/)
[![Express](https://img.shields.io/badge/Express-5-black?style=flat)](https://expressjs.com/)
[![Midtrans](https://img.shields.io/badge/Midtrans-Payment-%23FF5A5F?style=flat)](https://midtrans.com/)

## Project Overview

diLaundryin Backend is the API layer for a scalable laundry management system. Built with Express and TypeScript, it supports multi-role authentication, order lifecycle orchestration, payment processing, and dashboard-ready reporting. The architecture is modular to ensure maintainability and easier feature expansion.

## 🛠 Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js (v5)
- **Language**: TypeScript
- **Database**: PostgreSQL
- **ORM**: Prisma
- **Caching & Sessions**: Redis (ioredis)
- **Authentication**:
  - JWT (JSON Web Tokens)
  - Passport.js (Google OAuth 2.0)
  - Bcrypt (Password hashing)
- **Payments**: Midtrans API
- **File Storage**: Cloudinary (Multer for uploads)
- **Mailing**: Nodemailer with Handlebars templates
- **Scheduling**: Node-cron (for order expiry and automated tasks)
- **Validation**: Express-validator

## 📂 Project Structure

The project follows a modular architecture for better maintainability:

```text
src/
├── config/             # Configuration files (CORS, Passport, Prisma, etc.)
├── helpers/            # Utility functions and background jobs
├── middlewares/        # Express middlewares (Auth, Error handling)
├── modules/            # Domain-driven modules (Auth, Order, Outlet, etc.)
│   ├── [module-name]/
│   │   ├── [name].controller.ts
│   │   ├── [name].service.ts
│   │   ├── [name].router.ts
│   │   └── validators/
├── templates/          # Email templates (Handlebars)
├── types/              # Global TypeScript interfaces
└── app.ts              # Express application entry point
```

## 🚀 Getting Started

### 1. Environment Variables
Create a `.env` file in the root directory and configure the following:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/washio"
REDIS_URL="redis://localhost:6379"
JWT_SECRET="your_jwt_secret"
GOOGLE_CLIENT_ID="your_google_id"
GOOGLE_CLIENT_SECRET="your_google_secret"
CLOUDINARY_CLOUD_NAME="your_cloud_name"
MIDTRANS_SERVER_KEY="your_server_key"
# ... other vars
```

### 2. Installation & Setup
```bash
npm install
npx prisma generate
npx prisma db push # or migrate
npm run dev
```

## 🔑 Key Features

### 👤 Authentication
- Separate flows for Customers and Employees.
- Google OAuth integration.
- Role-based access control (RBAC) via middlewares.

### 🧺 Order Management
- Multi-step order lifecycle (Pending -> Pickup -> Processing -> Delivery -> Completed).
- Automatic assignment of tasks to Drivers and Workers.
- Expiry handling for unpaid orders.

### 💰 Payments
- Seamless integration with Midtrans.
- Webhook support for real-time payment status updates.

### 📊 Reporting
- Daily/Monthly reports for Outlet Admins and Super Admins.
- CSV/PDF export capabilities (if implemented).

## 🛡 API Documentation (Partial)

| Endpoint | Method | Description |
| :--- | :--- | :--- |
| `/auth/login` | POST | Customer login |
| `/auth-employee/login` | POST | Employee login |
| `/api/attendance` | POST/GET | Clock-in/out and history |
| `/order` | POST/GET | Customer order operations |
| `/super-admin/outlets` | ALL | Outlet management |

## 🧪 Best Practices Implemented
- **Modular Design**: Each feature is self-contained.
- **Service Layer**: Business logic is separated from controllers.
- **Strict Typing**: Full TypeScript implementation for type safety.
- **Centralized Error Handling**: Uniform error responses across all endpoints.
- **Validation**: Input validation at the router level.

## ⚙️ Challenges & Solutions

This backend demonstrates an ability to manage complex business logic while keeping the API modular and testable. Multi-role access, payment webhooks, and scheduled cleanup tasks are separated into focused modules, reducing coupling and enabling efficient iteration.

## 🤝 Contribution

Please fork the repository and submit pull requests for feature enhancements or fixes. Keep changes scoped, document API updates, and maintain TypeScript safety.

## License

MIT License
