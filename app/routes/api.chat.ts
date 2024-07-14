import { runWithTools } from "@cloudflare/ai-utils";
import { ActionFunctionArgs, redirect } from "@remix-run/cloudflare";
import { models } from "~/consts";
import { ChatMessage } from "~/type";
import Replicate from "replicate";
import { streamToArrayBuffer } from "~/lib/utils";
import { getUser } from "~/.server/session";

export async function action({ request, context }: ActionFunctionArgs) {
  const env = context.cloudflare.env;
  const user = await getUser(env, request);
  if (!user) {
    return new Response("Unauthorized", { status: 401 });
  }
  const { messages, model, image } = (await request.json()) as {
    image: number[];
    messages: ChatMessage[];
    model: any;
  };

  const modelInfo = models.find((m) => m.name === model);
  if (!modelInfo) {
    return new Response("Model not found", { status: 404 });
  }

  const { AI } = env;
  let response: ReadableStream;
  if (modelInfo.functionCall) {
    response = (await runWithTools(
      AI as any,
      "@hf/nousresearch/hermes-2-pro-mistral-7b",
      {
        messages: messages.slice(-1).concat({
          role: "system",
          content:
            "Please output markdown. if markdown contains image url, it will be rendered as image.",
        }),
        tools: [
          {
            name: "draw",
            description: "Draw image and return the image url",
            parameters: {
              type: "object",
              properties: {
                prompt: { type: "string", description: "prompt" },
              },
              required: ["prompt"],
            },
            function: async function ({ prompt }: { prompt: string }) {
              const result = await drawWithAI(
                request,
                context.cloudflare.env,
                prompt
              );
              return result;
            },
          },
        ],
      },
      {
        verbose: true,
        streamFinalResponse: true,
        strictValidation: true,
      }
    )) as ReadableStream;
  } else {
    switch (modelInfo.vision) {
      case true:
        const latestOneMesages = messages.slice(-1);
        const resp = await AI.run(model, { messages: latestOneMesages, image });
        const line = `data: ${JSON.stringify({
          response: resp.description,
        })}\n\n`;
        response = new ReadableStream({
          start(controller) {
            controller.enqueue(line);
            controller.close();
          },
        });
        break;
      case false:
        response = (await AI.run(model, {
          messages,
          stream: true,
        })) as ReadableStream;
    }
  }

  return new Response(response, {
    headers: {
      "content-type": "text/event-stream",
    },
  });
}

async function drawWithAI(
  request: Request,
  env: Env,
  prompt: string
): Promise<string> {
  const { AI, BUCKET } = env;
  const input = {
    prompt: prompt,
  };

  const resp = await AI.run(
    "@cf/stabilityai/stable-diffusion-xl-base-1.0",
    input
  );
  const data = await streamToArrayBuffer(resp);
  const key = `${crypto.randomUUID()}.png`;
  const object = await BUCKET.put(key, data);
  return `images/${object?.key}`;
}

async function drawWithReplicate(
  request: Request,
  env: Env,
  prompt: string
): Promise<string> {
  const { AI, BUCKET, REPLICATE_API_URL } = env;

  const replicate = new Replicate({
    auth: env.REPLICATE_API_TOKEN,
    baseUrl: REPLICATE_API_URL,
  });

  const input = {
    prompt: prompt,
  };

  const resp = (await replicate.run("stability-ai/stable-diffusion-3", {
    input,
  })) as any;
  return resp[0];
}
