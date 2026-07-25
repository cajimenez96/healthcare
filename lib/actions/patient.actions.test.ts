import mongoose from "mongoose";
import { describe, it, expect, afterEach, afterAll } from "vitest";

import { User } from "../db/models/User";
import { connectToDatabase } from "../db/mongodb";

import { createUser } from "./patient.actions";

describe("patient actions - connection handling", () => {
  afterEach(async () => {
    // Restore a working connection regardless of outcome — this suite
    // deliberately disconnects to simulate a fresh server process where no
    // prior code path has connected yet.
    await connectToDatabase();
    await User.deleteMany({});
  });

  afterAll(async () => {
    await mongoose.disconnect();
  });

  it("createUser establishes its own database connection instead of relying on a prior connect() call", async () => {
    await mongoose.disconnect();
    global._mongooseCache = undefined;
    mongoose.set("bufferTimeoutMS", 2000);

    const user = await createUser({
      name: "Fresh Connection",
      email: "freshconn@example.com",
      phone: "+1",
    });

    expect(user?.name).toBe("Fresh Connection");
  });
});
