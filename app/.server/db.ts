import { drizzle } from "drizzle-orm/d1";
import * as s from "~/schema";

export function dbWrapper(db: D1Database) {
  return drizzle(db, { schema });
}

export const schema = s;
