import { AvatarFallback, AvatarImage } from "@radix-ui/react-avatar";
import { ActionFunctionArgs, redirect } from "@remix-run/cloudflare";
import { Form, useActionData, useNavigation } from "@remix-run/react";
import { LoaderIcon } from "lucide-react";
import { getUser } from "~/.server/session";
import { Avatar } from "~/components/ui/avatar";
import { Button } from "~/components/ui/button";
import { Label } from "~/components/ui/label";
import { Textarea } from "~/components/ui/textarea";

export async function action({ request, context }: ActionFunctionArgs) {
  const env = context.cloudflare.env;
  const user = await getUser(env, request);
  if (!user) {
    return redirect("/signin");
  }
  const { promot } = Object.fromEntries(await request.formData());
  if (!promot || typeof promot !== "string") {
    return {
      error: "Please input your promot",
    };
  }
  const { AI, BUCKET } = env;
  const inputs = {
    prompt: promot,
  };
  const resp = await AI.run(
    "@cf/stabilityai/stable-diffusion-xl-base-1.0",
    inputs
  );
  const key = `${crypto.randomUUID()}.png`;
  const object = await BUCKET.put(key, await streamToArrayBuffer(resp));
  if (!object) {
    return {
      error: "Failed to save image",
    };
  }
  return {
    url: `/images/${object.key}`,
  };
}

export default function ImageNormalPage() {
  const actionData = useActionData() as any;
  const navigation = useNavigation();

  return (
    <div className="flex flex-col md:flex-row h-dvh">
      <div className="w-full flex flex-col gap-2 p-2 border-r md:w-96">
        <h1 className="font-bold text-xl">Image</h1>
        <Form method="POST" className="flex flex-col gap-2 p-2">
          <Label>Promot</Label>
          <Textarea
            id="promot"
            name="promot"
            placeholder="please input your promot"
          />
          <Button type="submit" disabled={navigation.state === "submitting"}>
            {navigation.state === "submitting" ? (
              <div className="flex items-center gap-2">
                <LoaderIcon className="animate-spin" />
                <span>Submitting</span>
              </div>
            ) : (
              <span>Submit</span>
            )}
          </Button>
        </Form>
      </div>
      <div className="w-full flex flex-1 justify-center items-center p-4">
        <Avatar className="w-full max-w-md rounded-md bg-muted size-64">
          {navigation.state !== "submitting" && (
            <AvatarImage src={actionData?.url} alt="" />
          )}
          <AvatarFallback className="flex w-full items-center justify-center animate-pulse" />
        </Avatar>
      </div>
    </div>
  );
}

export async function streamToArrayBuffer(readableStream: any) {
  const reader = readableStream.getReader();
  let chunks = []; // This will hold the chunks of data as Uint8Arrays
  let size = 0; // This will track the total length of the data

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    chunks.push(value);
    size += value.length;
  }

  // Combine the chunks into a single Uint8Array
  let combined = new Uint8Array(size);
  let offset = 0;
  for (let chunk of chunks) {
    combined.set(chunk, offset);
    offset += chunk.length;
  }

  // Convert the Uint8Array to an ArrayBuffer
  return combined.buffer;
}
