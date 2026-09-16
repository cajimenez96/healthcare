import mongoose from "mongoose";
import { encode } from "next-auth/jwt";
import { describe, it, expect, beforeAll, afterAll } from "vitest";

import { connectToDatabase } from "../../../../lib/db/mongodb";
import { GridFsFileStorage } from "../../../../lib/storage/GridFsFileStorage";

import { GET } from "./route";

const BUCKET_NAME = "patientDocuments";

// Mirrors getToken()'s own default cookie-name logic (next-auth/jwt) so this
// works whether NEXTAUTH_URL is http or https — hardcoding one name would
// make the test pass or fail based on environment, not on real behavior.
const secureCookie = process.env.NEXTAUTH_URL?.startsWith("https://") ?? Boolean(process.env.VERCEL);
const SESSION_COOKIE_NAME = secureCookie
  ? "__Secure-next-auth.session-token"
  : "next-auth.session-token";

// getToken() reads exclusively from req.cookies (a Map-like jar, same shape
// NextRequest provides) — it never parses the raw Cookie header itself, so
// a plain Request with a "cookie" header (however correct-looking) is
// silently ignored and treated as unauthenticated. Fake just enough of the
// NextRequest shape to exercise the real code path.
async function authenticatedRequest(url: string) {
  const token = await encode({
    secret: process.env.NEXTAUTH_SECRET!,
    token: { sub: "someone", role: "Paciente" },
  });
  return {
    url,
    headers: new Headers(),
    cookies: new Map([[SESSION_COOKIE_NAME, token]]),
  };
}

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

  it("returns 401 without a session, even for a real file", async () => {
    const content = "a scanned identification document";
    const blob = new Blob([content], { type: "text/plain" });
    const uploaded = await storage.upload(blob, "id.txt");
    uploadedIds.push(uploaded.id);

    const response = await GET(new Request(`http://localhost/api/files/${uploaded.id}`) as any, {
      params: Promise.resolve({ fileId: uploaded.id }),
    });

    expect(response.status).toBe(401);
  });

  it("streams back the exact bytes with the stored content type when authenticated", async () => {
    const content = "a scanned identification document";
    const blob = new Blob([content], { type: "text/plain" });
    const uploaded = await storage.upload(blob, "id.txt");
    uploadedIds.push(uploaded.id);

    const request = await authenticatedRequest(`http://localhost/api/files/${uploaded.id}`);
    const response = await GET(request as any, {
      params: Promise.resolve({ fileId: uploaded.id }),
    });

    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toBe("text/plain");
    const body = await response.text();
    expect(body).toBe(content);
  });

  it("returns 404 when the file does not exist", async () => {
    const request = await authenticatedRequest("http://localhost/api/files/missing");
    const response = await GET(request as any, {
      params: Promise.resolve({ fileId: new mongoose.Types.ObjectId().toString() }),
    });

    expect(response.status).toBe(404);
  });

  it("returns 404 for a malformed file id instead of throwing", async () => {
    const request = await authenticatedRequest("http://localhost/api/files/bad-id");
    const response = await GET(request as any, {
      params: Promise.resolve({ fileId: "not-an-object-id" }),
    });

    expect(response.status).toBe(404);
  });
});
