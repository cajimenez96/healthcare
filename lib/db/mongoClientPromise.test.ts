import { describe, it, expect, beforeEach, afterEach } from "vitest";

import { getMongoClientPromise } from "./mongoClientPromise";

describe("getMongoClientPromise", () => {
  const originalUri = process.env.MONGODB_URI;

  beforeEach(() => {
    global._mongoClientCache = undefined;
  });

  afterEach(async () => {
    if (global._mongoClientCache?.client) {
      await global._mongoClientCache.client.close();
    }
    global._mongoClientCache = undefined;
    process.env.MONGODB_URI = originalUri;
  });

  it("throws when MONGODB_URI is not defined", () => {
    delete process.env.MONGODB_URI;

    expect(() => getMongoClientPromise()).toThrow(
      "MONGODB_URI environment variable is not defined",
    );
  });

  it("connects and resolves a usable MongoClient", async () => {
    const client = await getMongoClientPromise();
    const ping = await client.db().command({ ping: 1 });

    expect(ping.ok).toBe(1);
  });

  it("returns the same cached promise on subsequent calls", async () => {
    const promise1 = getMongoClientPromise();
    const promise2 = getMongoClientPromise();

    expect(promise1).toBe(promise2);
    await promise1;
  });
});
