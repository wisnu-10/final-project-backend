import { v2 as cloudinary, UploadStream } from "cloudinary";
import {
  CLOUDINARY_API_KEY,
  CLOUDINARY_API_SECRET,
  CLOUDINARY_CLOUD_NAME,
} from "../config/main.config";

cloudinary.config({
  cloud_name: CLOUDINARY_CLOUD_NAME,
  api_key: CLOUDINARY_API_KEY,
  api_secret: CLOUDINARY_API_SECRET,
});

interface ICloudinaryUploadReturn {
  secureUrl: string;
}

export const cloudinaryUpload = async (
  file: Buffer,
): Promise<ICloudinaryUploadReturn> => {
  return new Promise((resolve, reject) => {
    cloudinary.uploader
      .upload_stream(
        {
          folder: "uploads",
        },
        (error, result?) => {
          if (error || !result) {
            return reject(error);
          }
          resolve({ secureUrl: result?.secure_url });
        },
      )
      .end(file);
  });
};
