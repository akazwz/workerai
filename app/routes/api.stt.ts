import { ActionFunctionArgs, json } from "@remix-run/cloudflare";
import { getUserIdOrThrow } from "~/.server/session";

const MAX_AUDIO_SIZE = 5 * 1024 * 1024; // 5MB

export async function action({ request, context }: ActionFunctionArgs) {
  const env = context.cloudflare.env;
  await getUserIdOrThrow(env, request);
  const blob = await request.arrayBuffer();
  if (!blob) {
    return json({ error: "No audio data found" }, { status: 400 });
  }
  if (blob.byteLength > MAX_AUDIO_SIZE) {
    return json({ error: "Audio file too large" }, { status: 400 });
  }
  const { AI } = context.cloudflare.env;
  const response = await AI.run("@cf/openai/whisper", {
    audio: [...new Uint8Array(blob)],
  });
  return json(response);
}
