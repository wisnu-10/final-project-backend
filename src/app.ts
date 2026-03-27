import express, { Request, Response, NextFunction } from "express";
import authRouter from "./modules/auth/auth.router";
import cookieParser from "cookie-parser";
import { corsOptions } from "./config/cors.config";
import cors from "cors";
import passport from "./config/passport.config";

const PORT = process.env.PORT || 8000;
const app = express();

app.use(cors(corsOptions));
app.use(express.json());
app.use(cookieParser());
app.use(passport.initialize());

app.use("/auth", authRouter)

app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.log(err);
  const statusCode = err.expose === true ? err.statusCode : 500;
  const message = err.expose === true ? err.message : 'Something went wrong';

  res.status(statusCode).json({
    success: false,
    message,
    data: null,
  });
});


app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
