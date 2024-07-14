import {
  ArrowBigUpIcon,
  ArrowLeftIcon,
  BotIcon,
  CornerDownLeft,
  EyeIcon,
  ImageIcon,
  LoaderIcon,
  MicIcon,
  MicOffIcon,
  Paperclip,
  SquareFunctionIcon,
  UserIcon,
} from "lucide-react";
import dayjs from "dayjs";
import localizedFormat from "dayjs/plugin/localizedFormat";
import { marked } from "marked";
import { events } from "fetch-event-stream";
import {
  ClientLoaderFunctionArgs,
  Link,
  useLoaderData,
  useNavigate,
  useSearchParams,
} from "@remix-run/react";
import { useEffect, useRef, useState } from "react";
import { Avatar, AvatarFallback } from "~/components/ui/avatar";
import { Button } from "~/components/ui/button";
import { Label } from "~/components/ui/label";
import { Textarea } from "~/components/ui/textarea";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from "~/components/ui/tooltip";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { ModelProps, models } from "~/consts";
import { antonDatabase } from "~/.client/db";
import { arrayBufferToBase64WithFileType, cn } from "~/lib/utils";
import { MessageDocType } from "~/.client/schema";
import { toast } from "sonner";

dayjs.extend(localizedFormat);

export async function clientLoader({ params }: ClientLoaderFunctionArgs) {
  return {
    id: params.id as string,
  };
}

export default function ConversationsPage() {
  const { id } = useLoaderData<typeof clientLoader>();
  const [messages, setMessages] = useState<MessageDocType[]>([]);
  const [ttsStatus, setTtsStatus] = useState<"idle" | "speeching" | "loading">(
    "idle"
  );
  const [image, setImage] = useState<File>();

  const navigate = useNavigate();

  const ttsStatusIcons = {
    idle: <MicIcon className="size-4" />,
    speeching: <MicOffIcon className="size-4" />,
    loading: <LoaderIcon className="size-4 animate-spin" />,
  };

  const messageEndRef = useRef<HTMLDivElement>(null);
  const outputingMessageRef = useRef<string>("");

  const [searchParams, setSearchParams] = useSearchParams({
    model: models[0].name,
  });

  const currentModel = models.find(
    (model) => model.name === searchParams.get("model")
  )!;

  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function summarizeTopic(messages: MessageDocType[]) {
    const resp = await fetch("/api/summarize", {
      method: "POST",
      body: JSON.stringify({
        messages: messages,
      }),
    });
    const data = (await resp.json()) as { response: string };
    await antonDatabase.conversations
      .findOne({
        selector: {
          id: id,
        },
      })
      .patch({ topic: data.response });
  }

  async function speechToText() {
    try {
      let silenceStart: number | null = null;
      const silenceThreshold = 1000;
      const audioContext = new AudioContext();
      let analyser = audioContext.createAnalyser();
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: false,
      });
      let recorder = new MediaRecorder(stream);
      const chunks: Blob[] = [];
      recorder.ondataavailable = (event) => {
        chunks.push(event.data);
      };
      recorder.onstart = () => {
        setTtsStatus("speeching");
        const source = audioContext.createMediaStreamSource(stream);
        source.connect(analyser);
        analyser.fftSize = 2048;
        checkSilence();
        checkStop();
      };
      recorder.onstop = async () => {
        try {
          console.log("stop");
          setTtsStatus("loading");
          const blob = new Blob(chunks, { type: "audio/wav" });
          const response = await fetch("/api/stt", {
            method: "POST",
            body: blob,
          });
          const { text } = (await response.json()) as { text: string };
          const messageTextarea = document.getElementById(
            "message"
          ) as HTMLTextAreaElement;
          messageTextarea.value = text;
        } catch (e) {
          console.error(e);
        } finally {
          setTtsStatus("idle");
        }
      };
      recorder.start();

      function checkSilence() {
        const dataArray = new Uint8Array(analyser.frequencyBinCount);
        analyser.getByteFrequencyData(dataArray);
        const sum = dataArray.reduce((a, b) => a + b, 0);
        const average = sum / dataArray.length;
        if (average < 5) {
          if (!silenceStart) {
            silenceStart = Date.now();
          } else if (Date.now() - silenceStart > silenceThreshold) {
            recorder?.stop();
            return;
          }
        } else {
          silenceStart = null;
        }

        setTimeout(checkSilence, 100);
      }

      function checkStop() {
        if (ttsStatus === "loading") {
          recorder.stop();
        }
        setTimeout(checkStop, 100);
      }
    } catch (e) {
      console.error(e);
    }
  }

  // Reverse the messages so that the latest message is at the bottom
  // need new array to avoid mutating the original array
  const reversedMessages = messages.slice().reverse();

  useEffect(() => {
    antonDatabase.messages
      .find({
        selector: {
          conversationId: id,
        },
      })
      .sort({ createdAt: "asc" })
      .$.subscribe((messages) => {
        setMessages(messages);
        if (messages.length == 4) {
          summarizeTopic(messages).then().catch(console.error);
        }
      });
    document.getElementById("message")?.focus();
  }, [id]);

  async function sendMessage(message: string) {
    try {
      outputingMessageRef.current = "...";
      await antonDatabase.messages.insert({
        id: crypto.randomUUID(),
        conversationId: id,
        role: "user",
        content: message,
        image: image
          ? arrayBufferToBase64WithFileType(
              await image.arrayBuffer(),
              image.type
            )
          : undefined,
        createdAt: new Date().toISOString(),
      });
      const messagesSendToServer = messages
        .map((item) => {
          return { role: item.role, content: item.content };
        })
        .concat({ role: "user", content: message });

      const response = await fetch("/api/chat", {
        method: "POST",
        body: JSON.stringify({
          model: currentModel.name,
          messages: messagesSendToServer,
          image: [...new Uint8Array(image ? await image.arrayBuffer() : [])],
        }),
      });
      if (response.status === 401) {
        toast.error("Unauthorized", { duration: 3000 });
        await new Promise((resolve) => setTimeout(resolve, 1000));
        navigate("/signin");
      }
      if (!response.ok) {
        return;
      }
      const stream = events(response);
      outputingMessageRef.current = "";
      for await (let event of stream) {
        if (!event.data) continue;
        if (
          event.data.includes("[DONE]") ||
          event.data.includes("<|im_end|>")
        ) {
          break;
        }
        const data = JSON.parse(event.data);
        if (!data.response) {
          continue;
        }
        outputingMessageRef.current += data.response;
      }
      await antonDatabase.messages.insert({
        id: crypto.randomUUID(),
        conversationId: id,
        role: "assistant",
        content: outputingMessageRef.current as string,
        createdAt: new Date().toISOString(),
      });
    } catch (e) {
      console.error(e);
    } finally {
      outputingMessageRef.current = "";
    }
  }

  return (
    <div className="h-dvh flex flex-col">
      <div className="flex  items-center p-2 border-b gap-4">
        <Button size="icon" variant="ghost" asChild className="md:hidden">
          <Link to="/chat">
            <ArrowLeftIcon />
          </Link>
        </Button>
        <Select
          onValueChange={(e) => {
            setSearchParams({ model: e.valueOf() });
          }}
        >
          <SelectTrigger className="w-fit text-xs">
            <SelectValue placeholder={<ModelItem model={currentModel} />} />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectLabel>Models</SelectLabel>
              {models.map((model, index) => (
                <SelectItem key={index} value={model.name}>
                  <div className="flex items-center gap-2 text-xs">
                    <div>{model.title}</div>
                    <div className="flex items-center gap-0.5">
                      {model.vision && <EyeIcon className="size-4" />}
                      {model.functionCall && (
                        <SquareFunctionIcon className="size-4" />
                      )}
                    </div>
                  </div>
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
        <div className="flex-1" />
      </div>
      <main className="flex-1 over flex gap-2 overflow-y-auto p-2 flex-col-reverse">
        <div ref={messageEndRef} />
        {outputingMessageRef.current && (
          <div className="flex gap-2 w-full max-w-4xl mx-auto will-change-auto">
            <Avatar>
              <AvatarFallback>
                <BotIcon />
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col gap-1">
              <span className="text-xs text-muted-foreground">
                {dayjs().format("LLL")}
              </span>
              <div
                dangerouslySetInnerHTML={{
                  __html: marked(outputingMessageRef.current || "..."),
                }}
                className="prose dark:prose-invert prose-sm max-w-full bg-secondary p-2 rounded-md mr-10 md:mr-20"
              />
            </div>
          </div>
        )}
        {reversedMessages.map((message, index) => {
          return (
            <div
              key={index}
              className={cn("flex gap-2 max-w-4xl w-full mx-auto", {
                "flex-row-reverse": message.role === "user",
              })}
            >
              <Avatar>
                <AvatarFallback>
                  {message.role === "user" ? <UserIcon /> : <BotIcon />}
                </AvatarFallback>
              </Avatar>
              <div
                className={cn("flex flex-col gap-1", {
                  "mr-10 md:mr-20": message.role === "assistant",
                  "ml-10 md:ml-20": message.role === "user",
                })}
              >
                <span className="text-xs text-muted-foreground">
                  {dayjs(message?.createdAt).format("LLL")}
                </span>
                <div className="flex flex-col bg-muted p-2 gap-2">
                  {message.image && (
                    <img
                      src={message.image}
                      alt="image"
                      className="size-36 rounded-md"
                    />
                  )}
                  <div
                    dangerouslySetInnerHTML={{
                      __html: marked(message.content),
                    }}
                    className="prose prose-img:mx-auto prose-img:rounded-md md:prose-img:max-w-md dark:prose-invert prose-sm max-w-full bg-secondary rounded-md"
                  />
                </div>
              </div>
            </div>
          );
        })}
      </main>
      <div className="p-4 max-w-4xl mx-auto w-full">
        <form
          id="message-form"
          onSubmit={async (event) => {
            event.preventDefault();
            const form = event.currentTarget;
            const formData = new FormData(form);
            const message = formData.get("message") as string;
            if (!message) {
              return;
            }
            form.reset();
            setImage(undefined);
            await sendMessage(message);
          }}
          className="relative overflow-hidden rounded-lg border bg-background focus-within:ring-1 focus-within:ring-ring"
        >
          <Label htmlFor="message" className="sr-only">
            Message
          </Label>
          <input
            type="file"
            hidden
            id="image"
            name="image"
            accept="images/*"
            onInput={(e) => {
              const files = e.currentTarget.files;
              if (!files) return;
              const file = files.item(0);
              if (!file) return;
              setImage(file);
            }}
          />
          <Textarea
            id="message"
            name="message"
            autoFocus
            placeholder="Type your message here..."
            className="min-h-12 resize-none border-0 p-3 shadow-none focus-visible:ring-0"
            onKeyDown={(event) => {
              if (event.key === "Enter" && event.shiftKey) {
                console.log("shift + enter");
                event.preventDefault();
                document
                  .getElementById("message-form")
                  ?.dispatchEvent(
                    new Event("submit", { bubbles: true, cancelable: true })
                  );
              }
            }}
          />
          <div className="flex items-center p-3 pt-0">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button type="button" variant="ghost" size="icon" disabled>
                    <Paperclip className="size-4" />
                    <span className="sr-only">Attach file</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="top">Attach File</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={speechToText}
                    disabled={ttsStatus !== "idle"}
                  >
                    {ttsStatusIcons[ttsStatus]}
                    <span className="sr-only">Use Microphone</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="top">Use Microphone</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    disabled={!currentModel.vision || !!image}
                    onClick={() => {
                      const imageInput = document.getElementById(
                        "image"
                      ) as HTMLImageElement;
                      imageInput.click();
                    }}
                  >
                    <ImageIcon className="size-4" />
                    <span className="sr-only">Attach Image</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="top">Attach Image</TooltipContent>
              </Tooltip>
              <div className="mx-2">
                {image && (
                  <img
                    src={URL.createObjectURL(image)}
                    alt="image"
                    className="size-8 rounded-md"
                  />
                )}
              </div>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button type="submit" size="sm" className="ml-auto gap-1.5">
                    {outputingMessageRef.current === "" ? (
                      "Send Message"
                    ) : (
                      <div className="flex items-center gap-1.5">
                        <LoaderIcon className="size-4 animate-spin" />
                        <span>Thinking...</span>
                      </div>
                    )}
                    <CornerDownLeft className="size-3.5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="top" className="flex items-center gap-1">
                  <ArrowBigUpIcon className="size-3.5" />
                  <CornerDownLeft className="size-3.5" />
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </form>
      </div>
    </div>
  );
}

function ModelItem({ model }: { model: ModelProps }) {
  return (
    <div className="flex items-center gap-2 text-xs">
      <div>{model.title}</div>
      <div className="flex items-center gap-0.5">
        {model.vision && <EyeIcon className="size-4" />}
        {model.functionCall && <SquareFunctionIcon className="size-4" />}
      </div>
    </div>
  );
}
