export interface ChatMessage extends RoleScopedChatInput {
  timestamp?: string;
}

export interface ChatConversation {
  id: string;
  name?: string;
  stared?: boolean;
  topic?: string;
  summary?: string;
  timestamp?: string;
}
