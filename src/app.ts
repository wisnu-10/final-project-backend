import express, { Request, Response, NextFunction } from "express";

const PORT = process.env.PORT || 8000;
const app = express();

app.use(express.json());


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
