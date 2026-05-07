const whiteList = [
  "http://localhost:3000",
  "http://127.0.0.1:3000",
  "https://dilaundryin.vercel.app",
];

export const corsOptions = {
  origin: function (origin: any, callback: any) {
    if (!origin) {
      return callback(null, true);
    }

    if (whiteList.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Origin not allowed by CORS"));
    }
  },
  credentials: true,
  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "X-Requested-With",
    "Cross-Origin-Resource-Policy",
  ],
  methods: ["GET", "HEAD", "PUT", "PATCH", "POST", "DELETE", "OPTIONS"],
};
