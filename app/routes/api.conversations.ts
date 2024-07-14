import { LoaderFunctionArgs, json } from "@remix-run/cloudflare";
import { drizzle } from "drizzle-orm/d1";
import { conversations } from "~/schema";

export async function loader({ context }: LoaderFunctionArgs) {
  const data = await drizzle(context.cloudflare.env.DB)
    .select()
    .from(conversations)
    .execute();
  return json(data);
}
