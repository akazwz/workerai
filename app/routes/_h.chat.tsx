import { NavLink, Outlet, useMatches, useNavigate } from "@remix-run/react";
import { useEffect, useState } from "react";
import { Button, buttonVariants } from "~/components/ui/button";
import { antonDatabase } from "~/.client/db";
import { ChatConversation } from "~/type";
import { cn } from "~/lib/utils";
import { StarIcon as StartIconSolid } from "@heroicons/react/24/solid";
import { StarIcon } from "@heroicons/react/24/outline";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { EllipsisVerticalIcon, PencilIcon, Trash2Icon } from "lucide-react";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import CustomDialog from "~/components/custom-dialog";
import { ConversationDocType } from "~/.client/schema";

export async function toggleConversationStar(conversation: ChatConversation) {
  await antonDatabase.conversations
    .findOne({
      selector: { id: conversation.id },
    })
    .patch({ stared: !conversation.stared });
}

export async function deleteConversation(conversationId: string) {
  await antonDatabase.conversations
    .findOne({
      selector: { id: conversationId },
    })
    .remove();
  await antonDatabase.messages
    .find({ selector: { conversationId: conversationId } })
    .remove();
}

export default function ChatLayout() {
  const [conversationId, setConversationId] = useState("");
  const [conversations, setConversations] = useState<ConversationDocType[]>([]);

  const matches = useMatches();
  const isChatRoot = !matches.some(
    (match) => match.id === "routes/_h.chat.$id"
  );

  const navigate = useNavigate();

  useEffect(() => {
    antonDatabase.conversations
      .find()
      .sort({ timestamp: "desc" })
      .$.subscribe((conversations) => {
        setConversations(conversations);
      });
  }, []);

  async function createConversation() {
    const doc = await antonDatabase.conversations.insert({
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    navigate(`/chat/${doc.id}`);
  }

  return (
    <div className="flex flex-1 h-full w-full">
      <div
        className={cn(
          "flex flex-col gap-2 w-full md:w-72 border-r p-2 flex-shrink-0",
          {
            "hidden md:flex": !isChatRoot,
          }
        )}
      >
        <span className="font-bold text-xl">Chat</span>
        <Button onClick={createConversation}>New Chat</Button>
        <div className="flex flex-col gap-2 overflow-y-auto p-2">
          {conversations.map((conversation) => {
            return (
              <NavLink
                unstable_viewTransition
                prefetch="viewport"
                to={`/chat/${conversation.id}`}
                key={conversation.id}
                className={({ isActive }) => {
                  return cn(
                    buttonVariants({ variant: "ghost", size: "lg" }),
                    "w-full px-2",
                    {
                      "bg-secondary": isActive,
                    }
                  );
                }}
              >
                <div className="w-full flex items-center gap-1">
                  <Button
                    asChild
                    size="icon"
                    variant="ghost"
                    className="flex-shrink-0 size-6 hover:text-yellow-500"
                    onClick={(e) => {
                      e.preventDefault();
                      toggleConversationStar(conversation);
                    }}
                  >
                    {conversation.stared ? (
                      <StartIconSolid className="text-yellow-500" />
                    ) : (
                      <StarIcon />
                    )}
                  </Button>
                  <span className="text-xs truncate w-full text-start">
                    {conversation.name || conversation.topic || "Untitled"}
                  </span>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation();
                        }}
                      >
                        <EllipsisVerticalIcon className="size-3.5" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuItem
                        className="gap-2"
                        onClick={(e) => {
                          e.stopPropagation();
                          setConversationId(conversation.id);
                        }}
                      >
                        <PencilIcon className="size-3.5" />
                        <span>Rename</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="gap-2"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteConversation(conversation.id);
                        }}
                      >
                        <Trash2Icon className="size-3.5 text-destructive" />
                        <span>Delete</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </NavLink>
            );
          })}
        </div>
        <CustomDialog
          open={conversationId !== ""}
          onClose={() => setConversationId("")}
          title="Rename"
        >
          <RenameConversationForm
            conversationId={conversationId}
            onClose={() => setConversationId("")}
          />
        </CustomDialog>
      </div>
      <div
        className={cn("flex-1", {
          "hidden md:block": isChatRoot,
        })}
      >
        <Outlet />
      </div>
    </div>
  );
}

export async function renameConversation(conversationId: string, name: string) {
  await antonDatabase.conversations
    .findOne({
      selector: { id: conversationId },
    })
    .patch({ name });
}

export interface RenameConversationFormProps
  extends React.ComponentProps<"form"> {
  conversationId: string;
  onClose: () => void;
}

export function RenameConversationForm({
  className,
  conversationId,
  onClose,
}: RenameConversationFormProps) {
  return (
    <form
      className={cn("grid items-start gap-4", className)}
      onSubmit={async (event) => {
        event.preventDefault();
        const form = event.currentTarget;
        const formData = new FormData(form);
        const name = formData.get("name") as string;
        if (!name) {
          return;
        }
        form.reset();
        await renameConversation(conversationId, name);
        onClose();
      }}
    >
      <Label htmlFor="name">Name</Label>
      <Input id="name" name="name" autoFocus />
      <Button className="w-full" type="submit">
        Save
      </Button>
    </form>
  );
}
