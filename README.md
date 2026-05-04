# Washio Backend API

The Washio Backend is a robust, scalable API built with Node.js and Express, designed to power the Washio Laundry Management System. It handles everything from customer orders and payment processing to employee attendance and regional management.

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
