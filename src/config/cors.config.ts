const whiteList = ["http://localhost:3000", "http://127.0.0.1:3000"];

export const corsOptions = {
  origin: function (origin: any, callback: any) {

    if (!origin) {
      return callback(null, true);
    }

    if (whiteList.includes(origin)) {
      return callback(null, true);
    }

    return callback(new Error("Origin not allowed by CORS"));
  },
  credentials: true,
};
