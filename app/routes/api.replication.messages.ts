import {
  ActionFunctionArgs,
  json,
  LoaderFunctionArgs,
} from "@remix-run/cloudflare";
import { inArray, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/d1";
import { dbWrapper, schema } from "~/.server/db";
import { getUserId } from "~/.server/session";

export async function loader({ request, context }: LoaderFunctionArgs) {
  const env = context.cloudflare.env;
  const userId = await getUserId(env, request);
  if (!userId) {
    return json("please login first", { status: 401 });
  }

  const query = new URLSearchParams(request.url);
  const batchSize = Number(query.get("batchSize"));
  let offset: any = Number(query.get("offset")) || 0;

  const db = dbWrapper(context.cloudflare.env.DB);

  const messages = await db.query.messages.findMany({});
  let checkpoint: any = null;
  if (messages.length > 0 && messages.length < batchSize) {
    checkpoint = null;
  } else {
    checkpoint = {
      offset: offset + batchSize,
    };
  }

  return json({
    checkpoint: checkpoint,
    documents: messages,
  });
}

export async function action({ request, context }: ActionFunctionArgs) {
  const env = context.cloudflare.env;
  const userId = await getUserId(env, request);
  if (!userId) {
    return json("please login first", { status: 401 });
  }

  const replations = (await request.json()) as Array<{
    assumedMasterState: any;
    newDocumentState: any;
  }>;

  const db = drizzle(context.cloudflare.env.DB);

  let ToDeleteIds: string[] = [];
  let ToInsert: any[] = [];
  let ToUpdate: any[] = [];

  replations.forEach((replation) => {
    if (replation.newDocumentState.deleted) {
      ToDeleteIds.push(replation.newDocumentState.id as string);
    } else {
      if (replation.assumedMasterState) {
        ToUpdate.push(replation.newDocumentState);
      } else {
        ToInsert.push(replation.newDocumentState);
      }
    }
  });

  if (ToDeleteIds.length > 0) {
    await db
      .update(schema.messages)
      .set({ deleted: true })
      .where(inArray(schema.messages.id, ToDeleteIds))
      .execute();
  }

  if (ToInsert.length > 0) {
    await db.insert(schema.messages).values(ToInsert).execute();
  }

  if (ToUpdate.length > 0) {
    for (let item of ToUpdate) {
      item.updatedAt = new Date().toISOString();
      await db
        .update(schema.messages)
        .set(item)
        .where(eq(schema.messages.id, item.id))
        .execute();
    }
  }

  return json({ hello: "world" });
}
