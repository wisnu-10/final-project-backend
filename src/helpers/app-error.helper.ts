export default function AppError(message: string, statusCode: number) {
  const error = new Error(message) as Error & {
    statusCode: number;
    expose: boolean;
  };

  error.statusCode = statusCode;
  error.expose = true;

  return error;
}
