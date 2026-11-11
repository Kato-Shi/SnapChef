import { env } from "cloudflare:workers";
import { drizzle } from "drizzle-orm/d1";
import * as schema from "./schema";

export function getDb() {
  try {
    if (env?.DB) {
      return drizzle(env.DB, { schema });
    }
  } catch {
    // fallback to mock
  }

  console.warn("[AI Studio] Database not connected — using mock");
  const noOp = {
    findMany: async () => [],
    findFirst: async () => null,
    findUnique: async () => null,
    create: async (d?: { data?: unknown }) => d?.data ?? {},
    update: async (d?: { data?: unknown }) => d?.data ?? {},
    delete: async () => ({}),
  };
  return new Proxy({} as unknown as ReturnType<typeof drizzle<typeof schema>>, {
    get: (_, prop) =>
      prop === "query" ? new Proxy({}, { get: () => noOp }) : async () => [],
  });
}
