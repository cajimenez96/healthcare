import mongoose from "mongoose";
import { Readable } from "stream";
import { connectToDatabase } from "../db/mongodb";
import type { IFileStorage, UploadedFile } from "../repositories/IFileStorage";

export const GRIDFS_BUCKET_NAME = "patientDocuments";

export class GridFsFileStorage implements IFileStorage {
  async upload(blob: Blob, fileName: string): Promise<UploadedFile> {
    const conn = await connectToDatabase();
    const db = conn.connection.db;
    if (!db) {
      throw new Error("Database connection is not established");
    }

    const bucket = new mongoose.mongo.GridFSBucket(db, {
      bucketName: GRIDFS_BUCKET_NAME,
    });

    const buffer = Buffer.from(await blob.arrayBuffer());
    const uploadStream = bucket.openUploadStream(fileName, {
      metadata: blob.type ? { contentType: blob.type } : undefined,
    });

    await new Promise<void>((resolve, reject) => {
      Readable.from(buffer)
        .pipe(uploadStream)
        .on("error", reject)
        .on("finish", () => resolve());
    });

    const id = uploadStream.id.toString();
    return { id, url: `/api/files/${id}` };
  }
}
