import { LoaderFunctionArgs } from "@remix-run/cloudflare";
import { getUserOrThrow } from "~/.server/session";

export async function loader({ context, request, params }: LoaderFunctionArgs) {
  const env = context.cloudflare.env;
  await getUserOrThrow(env, request);
  const key = params.key as string;
  const { BUCKET } = context.cloudflare.env;
  const object = await BUCKET.get(key);
  return new Response(object?.body);
}
