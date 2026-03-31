import "dotenv/config";

export const DATABASE_URL = process.env.DATABASE_URL;
export const BASE_URL = process.env.BASE_URL
export const USER_EMAILER = process.env.USER_EMAILER;
export const PASSWORD_EMAILER = process.env.PASSWORD_EMAILER;
export const JWT_ACCOUNT_ACTIOVATION_SECRET_KEY = process.env.JWT_ACCOUNT_ACTIOVATION_SECRET_KEY
export const POS_APP_URL = process.env.POS_APP_URL
export const JWT_TOKEN_SECRET_KEY = process.env.JWT_TOKEN_SECRET_KEY;
export const JWT_RESET_PASSWORD = process.env.JWT_RESET_PASSWORD
export const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
export const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET; 
export const JWT_OAUTH_SECRET_KEY = process.env.JWT_OAUTH_SECRET_KEY;
export const CLOUDINARY_CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME;
export const CLOUDINARY_API_KEY = process.env.CLOUDINARY_API_KEY;
export const CLOUDINARY_API_SECRET = process.env.CLOUDINARY_API_SECRET;
export const JWT_UPDATE_EMAIL_SECRET_KEY = process.env.JWT_UPDATE_EMAIL_SECRET_KEY
export const JWT_UPDATE_PASSWORD_SECRET_KEY =
  process.env.JWT_UPDATE_PASSWORD_SECRET_KEY;
