import mongoose from "mongoose";
import { describe, it, expect, beforeAll, afterAll } from "vitest";

import { connectToDatabase } from "../../../../lib/db/mongodb";
import { GridFsFileStorage } from "../../../../lib/storage/GridFsFileStorage";

import { GET } from "./route";

const BUCKET_NAME = "patientDocuments";

describe("GET /api/files/[fileId]", () => {
  const storage = new GridFsFileStorage();
  const uploadedIds: string[] = [];

  beforeAll(async () => {
    await connectToDatabase();
  });

  afterAll(async () => {
    const conn = await connectToDatabase();
    const db = conn.connection.db!;
    const bucket = new mongoose.mongo.GridFSBucket(db, { bucketName: BUCKET_NAME });
    for (const id of uploadedIds) {
      await bucket.delete(new mongoose.Types.ObjectId(id)).catch(() => undefined);
    }
    await mongoose.disconnect();
  });

  it("streams back the exact bytes with the stored content type", async () => {
    const content = "a scanned identification document";
    const blob = new Blob([content], { type: "text/plain" });
    const uploaded = await storage.upload(blob, "id.txt");
    uploadedIds.push(uploaded.id);

    const response = await GET(new Request(`http://localhost/api/files/${uploaded.id}`), {
      params: Promise.resolve({ fileId: uploaded.id }),
    });

    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toBe("text/plain");
    const body = await response.text();
    expect(body).toBe(content);
  });

  it("returns 404 when the file does not exist", async () => {
    const response = await GET(new Request("http://localhost/api/files/missing"), {
      params: Promise.resolve({ fileId: new mongoose.Types.ObjectId().toString() }),
    });

    expect(response.status).toBe(404);
  });

  it("returns 404 for a malformed file id instead of throwing", async () => {
    const response = await GET(new Request("http://localhost/api/files/bad-id"), {
      params: Promise.resolve({ fileId: "not-an-object-id" }),
    });

    expect(response.status).toBe(404);
  });
});
