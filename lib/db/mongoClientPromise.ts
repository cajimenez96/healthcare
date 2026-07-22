import { MongoClient } from "mongodb";

interface MongoClientCache {
  client: MongoClient | null;
  promise: Promise<MongoClient> | null;
}

declare global {
  var _mongoClientCache: MongoClientCache | undefined;
}

export function getMongoClientPromise(): Promise<MongoClient> {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error("MONGODB_URI environment variable is not defined");
  }

  const cache: MongoClientCache = global._mongoClientCache ?? {
    client: null,
    promise: null,
  };
  global._mongoClientCache = cache;

  if (!cache.promise) {
    cache.client = new MongoClient(uri);
    cache.promise = cache.client.connect();
  }

  return cache.promise;
}
