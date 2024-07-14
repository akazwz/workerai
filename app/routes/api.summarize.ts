import { ActionFunctionArgs, json } from "@remix-run/cloudflare";
import { getUserIdOrThrow } from "~/.server/session";

export async function action({ request, context }: ActionFunctionArgs) {
  const env = context.cloudflare.env;
  await getUserIdOrThrow(env, request);
  const { messages } = (await request.json()) as { messages: any[] };
  const { AI } = context.cloudflare.env;
  const response = await AI.run("@cf/meta/llama-3-8b-instruct", {
    messages: messages.concat({
      role: "system",
      content:
        "Please tell me the conversations topic. the result must be a single sentence.",
    }),
  });
  return json(response);
}
