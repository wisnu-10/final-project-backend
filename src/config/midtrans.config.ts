// src/config/midtrans.config.ts
import midtransClient from "midtrans-client";
import { MIDTRANS_CLIENT_KEY, MIDTRANS_SERVER_KEY } from "./main.config";

export const snap = new (midtransClient as any).Snap({
  isProduction: false, // Wajib FALSE karena kita masih di tahap development (Sandbox)
  serverKey: MIDTRANS_SERVER_KEY,
  clientKey: MIDTRANS_CLIENT_KEY,
});

console.log("✅ Midtrans Ready to Initialized (Sandbox Mode)");
