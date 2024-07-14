import {
  ActionFunctionArgs,
  json,
  LoaderFunctionArgs,
} from "@remix-run/cloudflare";
import { inArray, eq, and, gte } from "drizzle-orm";
import { getUserId } from "~/.server/session";
import { dbWrapper, schema } from "~/.server/db";

export async function loader({ request, context }: LoaderFunctionArgs) {
  const env = context.cloudflare.env;
  const userId = await getUserId(env, request);
  if (!userId) {
    return json("please login first", { status: 401 });
  }

  const query = new URLSearchParams(request.url);
  const batchSize = Number(query.get("batchSize")) || 10;
  let updatedAt = query.get("updatedAt") || new Date(0).toISOString();

  const db = dbWrapper(context.cloudflare.env.DB);
  const conversations = await db.query.conversations.findMany({
    where: and(
      eq(schema.conversations.ownerId, userId),
      gte(schema.conversations.updatedAt, updatedAt)
    ),
    limit: batchSize,
  });

  let checkpoint: any = null;
  if (conversations.length > 0) {
    checkpoint = {
      updatedAt: conversations[conversations.length - 1].updatedAt,
    };
  }

  return json({
    checkpoint: checkpoint,
    documents: conversations,
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

  const db = dbWrapper(context.cloudflare.env.DB);

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
        const doc = replation.newDocumentState;
        doc.ownerId = userId;
        ToInsert.push(doc);
      }
    }
  });

  if (ToDeleteIds.length > 0) {
    await db
      .update(schema.conversations)
      .set({ deleted: true })
      .where(inArray(schema.conversations.id, ToDeleteIds))
      .execute();
  }

  if (ToInsert.length > 0) {
    await db.insert(schema.conversations).values(ToInsert).execute();
  }

  if (ToUpdate.length > 0) {
    for (let item of ToUpdate) {
      item.updatedAt = new Date().toISOString();
      await db
        .update(schema.conversations)
        .set(item)
        .where(eq(schema.conversations.id, item.id))
        .execute();
    }
  }

  return json({ hello: "world" });
}
