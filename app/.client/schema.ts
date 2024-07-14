import {
  toTypedRxJsonSchema,
  RxJsonSchema,
  ExtractDocumentTypeFromTypedRxJsonSchema,
  RxCollection,
} from "rxdb";

export type ConversationCollection = RxCollection<ConversationDocType>;
export type MessageCollection = RxCollection<MessageDocType>;
export type UserCollection = RxCollection<UserDocType>;

export type AntonDataBaseCollections = {
  conversations: ConversationCollection;
  messages: MessageCollection;
  users: UserCollection;
};

export const conversationSchemaLiteral = {
  version: 0,
  primaryKey: "id",
  type: "object",
  properties: {
    id: {
      type: "string",
      maxLength: 100, // <- the primary key must have set maxLength
    },
    ownnerId: {
      type: "string",
    },
    stared: {
      type: "boolean",
    },
    name: {
      type: "string",
    },
    topic: {
      type: "string",
    },
    summary: {
      type: "string",
    },
    createdAt: {
      type: "string",
      format: "date-time",
    },
    updatedAt: {
      type: "string",
      format: "date-time",
    },
  },
  required: ["id", "createdAt"],
} as const;

const conversationSchemaTyped = toTypedRxJsonSchema(conversationSchemaLiteral);
export type ConversationDocType = ExtractDocumentTypeFromTypedRxJsonSchema<
  typeof conversationSchemaTyped
>;
export const conversationSchema: RxJsonSchema<ConversationDocType> =
  conversationSchemaLiteral;

export const messageSchemaLiteral = {
  version: 0,
  primaryKey: "id",
  type: "object",
  properties: {
    id: {
      type: "string",
      maxLength: 100, // <- the primary key must have set maxLength
    },
    conversationId: {
      type: "string",
    },
    role: {
      type: "string",
      enum: ["user", "assistant", "system", "tool"],
    },
    content: {
      type: "string",
    },
    image: {
      type: "string",
    },
    createdAt: {
      type: "string",
      format: "date-time",
    },
  },
  required: ["id", "conversationId", "role", "content", "createdAt"],
} as const;

const messageSchemaTyped = toTypedRxJsonSchema(messageSchemaLiteral);
export type MessageDocType = ExtractDocumentTypeFromTypedRxJsonSchema<
  typeof messageSchemaTyped
>;
export const messageSchema: RxJsonSchema<MessageDocType> = messageSchemaLiteral;

export const userSchemaLiteral = {
  version: 0,
  primaryKey: "id",
  type: "object",
  properties: {
    id: {
      type: "string",
      maxLength: 100, // <- the primary key must have set maxLength
    },
    name: {
      type: "string",
    },
    avatar: {
      type: "string",
    },
    email: {
      type: "string",
    },
    plan: {
      type: "string",
    },
    createdAt: {
      type: "string",
      format: "date-time",
    },
    updatedAt: {
      type: "string",
      format: "date-time",
    },
  },
  required: ["id", "name"],
} as const;

const userSchemaTyped = toTypedRxJsonSchema(userSchemaLiteral);
export type UserDocType = ExtractDocumentTypeFromTypedRxJsonSchema<
  typeof userSchemaTyped
>;
export const userSchema: RxJsonSchema<UserDocType> = userSchemaLiteral;
