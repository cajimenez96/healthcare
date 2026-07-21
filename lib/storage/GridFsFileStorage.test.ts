import { describe, it, expect, beforeAll, afterAll } from "vitest";
import mongoose from "mongoose";
import { connectToDatabase } from "../db/mongodb";
import { GridFsFileStorage } from "./GridFsFileStorage";

const BUCKET_NAME = "patientDocuments";

async function deleteUploadedFile(id: string) {
  const conn = await connectToDatabase();
  const db = conn.connection.db!;
  const bucket = new mongoose.mongo.GridFSBucket(db, { bucketName: BUCKET_NAME });
  await bucket.delete(new mongoose.Types.ObjectId(id));
}

describe("GridFsFileStorage", () => {
  const storage = new GridFsFileStorage();
  const uploadedIds: string[] = [];

  beforeAll(async () => {
    await connectToDatabase();
  });

  afterAll(async () => {
    for (const id of uploadedIds) {
      await deleteUploadedFile(id).catch(() => undefined);
    }
    await mongoose.disconnect();
  });

  it("uploads a blob and returns an id and a resolvable /api/files url", async () => {
    const content = "hello identification document";
    const blob = new Blob([content], { type: "text/plain" });

    const result = await storage.upload(blob, "id-doc.txt");
    uploadedIds.push(result.id);

    expect(typeof result.id).toBe("string");
    expect(result.url).toBe(`/api/files/${result.id}`);
  });

  it("stores the exact bytes so they can be downloaded back unchanged", async () => {
    const content = "the quick brown fox jumps over the lazy dog";
    const blob = new Blob([content], { type: "text/plain" });

    const result = await storage.upload(blob, "fox.txt");
    uploadedIds.push(result.id);

    const conn = await connectToDatabase();
    const db = conn.connection.db!;
    const bucket = new mongoose.mongo.GridFSBucket(db, { bucketName: BUCKET_NAME });

    const chunks: Buffer[] = [];
    await new Promise<void>((resolve, reject) => {
      bucket
        .openDownloadStream(new mongoose.Types.ObjectId(result.id))
        .on("data", (chunk) => chunks.push(chunk))
        .on("error", reject)
        .on("end", resolve);
    });

    expect(Buffer.concat(chunks).toString("utf-8")).toBe(content);
  });
});
