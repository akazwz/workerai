import {
  createCookie,
  createWorkersKVSessionStorage,
} from "@remix-run/cloudflare";
import { eq } from "drizzle-orm";
import { dbWrapper, schema } from "~/.server/db";

// In this example the Cookie is created separately.

export function cookieWrapper(secret: string) {
  return createCookie("__session", {
    secrets: [secret],
    sameSite: true,
  });
}

export function sessionWrapper(kv: KVNamespace, secret: string) {
  const sessionCookie = cookieWrapper(secret);
  return createWorkersKVSessionStorage({
    // The KV Namespace where you want to store sessions
    kv: kv,
    cookie: sessionCookie,
  });
}

export async function getUserIdOrThrow(env: Env, request: Request) {
  const { KV, SESSION_SECRET } = env;
  const { getSession } = sessionWrapper(KV, SESSION_SECRET);
  const session = await getSession(request.headers.get("Cookie"));
  const userId = session.get("userId") as string;
  if (!userId) {
    throw new Error("User Is Not Logged In");
  }
  return userId;
}

export async function getUserId(env: Env, request: Request) {
  const { KV, SESSION_SECRET } = env;
  const { getSession } = sessionWrapper(KV, SESSION_SECRET);
  const session = await getSession(request.headers.get("Cookie"));
  const userId = session.get("userId");
  if (!userId) {
    return null;
  }
  return userId as string;
}

export async function getUserOrThrow(env: Env, request: Request) {
  const { KV, DB, SESSION_SECRET } = env;
  const userId = await getUserIdOrThrow(env, request);
  const db = dbWrapper(DB);
  const user = await db.query.users.findFirst({
    where: eq(schema.users.id, userId),
  });
  if (!user) {
    throw new Error("User Not Found");
  }
  return user;
}

export async function getUser(env: Env, request: Request) {
  const { KV, DB, SESSION_SECRET } = env;
  const userId = await getUserId(env, request);
  if (!userId) {
    return null;
  }
  const db = dbWrapper(DB);
  try {
    const user = await db.query.users.findFirst({
      where: eq(schema.users.id, userId),
    });
    return user;
  } catch (error) {
    console.error(error);
  }
  return null;
}

export async function signOut(env: Env, request: Request) {
  const { getSession, commitSession } = sessionWrapper(
    env.KV,
    env.SESSION_SECRET
  );
  const session = await getSession(request.headers.get("Cookie"));
  session.unset("userId");
  return await commitSession(session);
}
