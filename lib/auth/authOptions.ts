import { MongoDBAdapter } from "@next-auth/mongodb-adapter";
import type { AuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { connectToDatabase } from "../db/mongodb";
import { getMongoClientPromise } from "../db/mongoClientPromise";
import { MongoUserRepository } from "../db/repositories/MongoUserRepository";
import { authenticateCredentials } from "./authenticateCredentials";

const userRepository = new MongoUserRepository();

export const authOptions: AuthOptions = {
  adapter: MongoDBAdapter(getMongoClientPromise()),
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        await connectToDatabase();
        return authenticateCredentials(
          credentials?.email,
          credentials?.password,
          userRepository,
        );
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role;
        token.doctorId = user.doctorId;
      }
      return token;
    },
    async session({ session, token }) {
      session.user.id = token.sub!;
      session.user.role = token.role;
      session.user.doctorId = token.doctorId;
      return session;
    },
  },
};
