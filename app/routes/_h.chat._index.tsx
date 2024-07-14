import { MessageSquareMoreIcon } from "lucide-react";

export default function ChatIndex() {
  return (
    <div className="flex items-center h-full justify-center flex-col gap-4">
      <MessageSquareMoreIcon className="size-12" />
      <h1 className="font-bold text-xl">Please select a chat to start</h1>
    </div>
  );
}
