import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { relations } from "drizzle-orm";

export const users = sqliteTable("users", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  email: text("email").unique(),
  name: text("name"),
  avatar: text("avatar"),
  plan: text("plan").default("free"),
  createdAt: text("created_at").$defaultFn(() => new Date().toISOString()),
  updatedAt: text("updated_at")
    .$defaultFn(() => new Date().toISOString())
    .$onUpdateFn(() => new Date().toISOString()),
});

export const userRelations = relations(users, ({ many }) => ({
  conversations: many(conversations),
}));

export const conversations = sqliteTable("conversations", {
  id: text("id").primaryKey(),
  name: text("name"),
  ownerId: text("owner_id"),
  stared: integer("stared", { mode: "boolean" }).default(false),
  pinned: integer("pinned", { mode: "boolean" }).default(false),
  topic: text("topic"),
  summary: text("summary"),
  deleted: integer("deleted", { mode: "boolean" }).default(false),
  createdAt: text("created_at").$defaultFn(() => new Date().toISOString()),
  updatedAt: text("updated_at")
    .$defaultFn(() => new Date().toISOString())
    .$onUpdateFn(() => new Date().toISOString()),
});

export const conversationRelations = relations(
  conversations,
  ({ one, many }) => ({
    ownner: one(users, {
      fields: [conversations.ownerId],
      references: [users.id],
    }),
    messages: many(messages),
  })
);

export const messages = sqliteTable("messages", {
  id: text("id").primaryKey(),
  conversationId: text("conversationId"),
  role: text("role"),
  content: text("content"),
  image: text("image"),
  deleted: integer("deleted", { mode: "boolean" }).default(false),
  createdAt: text("created_at").$defaultFn(() => new Date().toISOString()),
  updatedAt: text("updated_at")
    .$defaultFn(() => new Date().toISOString())
    .$onUpdateFn(() => new Date().toISOString()),
});

export const messageRelations = relations(messages, ({ one }) => ({
  parentConversation: one(conversations, {
    fields: [messages.conversationId],
    references: [conversations.id],
  }),
}));
