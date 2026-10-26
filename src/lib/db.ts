import postgres from "postgres";

// One shared client. In dev, Next.js hot reload re-imports modules, so cache it on globalThis.
const globalForDb = globalThis as unknown as { sql?: postgres.Sql };

export const sql =
  globalForDb.sql ??
  postgres(process.env.DATABASE_URL ?? process.env.POSTGRES_URL ?? "postgres://bm:bm@localhost:5432/bm", {
    max: 5,
    transform: postgres.camel,
  });

if (process.env.NODE_ENV !== "production") globalForDb.sql = sql;
