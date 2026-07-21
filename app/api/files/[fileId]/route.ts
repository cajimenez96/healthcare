import mongoose from "mongoose";
import { connectToDatabase } from "../../../../lib/db/mongodb";
import { GRIDFS_BUCKET_NAME } from "../../../../lib/storage/GridFsFileStorage";

export async function GET(
  _request: Request,
  { params }: { params: { fileId: string } },
) {
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
