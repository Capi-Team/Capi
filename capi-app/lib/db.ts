import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
  prismaAdapter?: PrismaPg;
};

const connectionString = process.env.DIRECT_URL || process.env.DATABASE_URL;
const adapter =
  globalForPrisma.prismaAdapter ??
  (connectionString ? new PrismaPg({ connectionString }) : undefined);

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prismaAdapter = adapter;
}

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = db;
}
