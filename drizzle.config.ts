import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "app/schema.ts",
  dialect: "sqlite",
  verbose: true,
  strict: true,
});
