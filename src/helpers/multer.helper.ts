import { Request } from "express";
import multer, { FileFilterCallback } from "multer";
import path from "node:path";
import { cwd } from "node:process";

export function multerUpload(
  directory: string,
  uniqueFileName: string,
  allowedFileFormat: string[],
  diskStorage: "disk" | "memory",
) {
  const storage =
    diskStorage === "disk"
      ? multer.diskStorage({
          destination: function (req, file, cb) {
            const mainDirectory = path.join(cwd());
            cb(null, `${mainDirectory}/${directory}`);
          },
          filename: function (req, file, cb) {
            {
              const uniqueSuffix =
                Date.now() + "-" + Math.round(Math.random() * 1e9);
              const arrayOriginName = file?.originalname?.split(".");
              cb(
                null,
                uniqueFileName +
                  "-" +
                  uniqueSuffix +
                  "." +
                  arrayOriginName[arrayOriginName?.length - 1],
              );
            }
          },
        })
      : multer.memoryStorage();

  function fileFilter(
    req: Request,
    file: Express.Multer.File,
    cb: FileFilterCallback,
  ) {
    const arrayOriginName = file?.originalname?.split(".");

    if (
      !allowedFileFormat.includes(arrayOriginName[arrayOriginName?.length - 1])
    ) {
      return cb(new Error("Format file not accepted"));
    }

    cb(null, true);
  }
  return multer({ storage, fileFilter, limits: { fileSize: 1 * 1024 * 1024 } });
}
