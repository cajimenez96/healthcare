import mongoose from "mongoose";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

import { connectToDatabase } from "../../../../lib/db/mongodb";
import { GRIDFS_BUCKET_NAME } from "../../../../lib/storage/GridFsFileStorage";

export async function GET(request: NextRequest, props: { params: Promise<{ fileId: string }> }) {
  // getToken (not getServerSession) — it reads the JWT straight off the
  // request's cookies, same mechanism middleware.ts uses, and doesn't
  // depend on the ambient request-scope context that getServerSession
  // needs (which isn't available when calling this handler directly, e.g.
  // from tests). Any authenticated session is enough — this endpoint isn't
  // trying to enforce "only the owning patient", just "not the whole
  // internet unauthenticated" (TASK-015 / SEG-02).
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
  if (!token) {
    return new Response(null, { status: 401 });
  }

  const params = await props.params;
  if (!mongoose.isValidObjectId(params.fileId)) {
    return new Response(null, { status: 404 });
  }

  const conn = await connectToDatabase();
  const db = conn.connection.db;
  if (!db) {
    return new Response(null, { status: 500 });
  }

  const objectId = new mongoose.Types.ObjectId(params.fileId);
  const bucket = new mongoose.mongo.GridFSBucket(db, {
    bucketName: GRIDFS_BUCKET_NAME,
  });

  const files = await bucket.find({ _id: objectId }).toArray();
  const file = files[0];
  if (!file) {
    return new Response(null, { status: 404 });
  }

  const chunks: Buffer[] = [];
  await new Promise<void>((resolve, reject) => {
    bucket
      .openDownloadStream(objectId)
      .on("data", (chunk) => chunks.push(chunk))
      .on("error", reject)
      .on("end", resolve);
  });

  return new Response(Buffer.concat(chunks), {
    status: 200,
    headers: {
      "Content-Type":
        (file.metadata?.contentType as string | undefined) ??
        "application/octet-stream",
    },
  });
}
