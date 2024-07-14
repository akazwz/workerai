import {
  ActionFunctionArgs,
  json,
  LoaderFunctionArgs,
} from "@remix-run/cloudflare";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/d1";
import { getUser, getUserOrThrow } from "~/.server/session";
import { schema } from "~/.server/db";

export async function loader({ request, context }: LoaderFunctionArgs) {
  const env = context.cloudflare.env;
  const user = await getUser(env, request);

  return json({
    checkpoint: null,
    documents: [user],
  });
}

export async function action({ request, context }: ActionFunctionArgs) {
  const env = context.cloudflare.env;
  const user = await getUserOrThrow(env, request);

  const replations = (await request.json()) as Array<{
    assumedMasterState: any;
    newDocumentState: any;
  }>;

  const db = drizzle(context.cloudflare.env.DB);

  let newUser: any;
  replations.forEach((replation) => {
    if (replation.assumedMasterState) {
      newUser = replation.newDocumentState;
    }
  });

  if (newUser) {
    newUser.updatedAt = new Date().toISOString();
    newUser.id = user.id;
    await db
      .update(schema.users)
      .set(newUser)
      .where(eq(schema.users.id, user.id));
  }

  return json({ hello: "world" });
}
