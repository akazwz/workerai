import { createRxDatabase, addRxPlugin } from "rxdb";
import { getRxStorageDexie } from "rxdb/plugins/storage-dexie";
import { RxDBQueryBuilderPlugin } from "rxdb/plugins/query-builder";
import { replicateRxCollection } from "rxdb/plugins/replication";
import { RxDBUpdatePlugin } from "rxdb/plugins/update";
import { conversationSchema, messageSchema, userSchema } from "./schema";

addRxPlugin(RxDBQueryBuilderPlugin);
addRxPlugin(RxDBUpdatePlugin);

export const antonDatabase = await createRxDatabase({
  name: "anton",
  storage: getRxStorageDexie(),
});

await antonDatabase.addCollections({
  conversations: {
    schema: conversationSchema,
  },
  messages: {
    schema: messageSchema,
  },
  users: {
    schema: userSchema,
  },
});

export async function initAntonDatabase() {
  let antonDatabase = await createRxDatabase({
    name: "anton",
    storage: getRxStorageDexie(),
  });
  await antonDatabase.addCollections({
    conversations: {
      schema: conversationSchema,
    },
    messages: {
      schema: messageSchema,
    },
    users: {
      schema: userSchema,
    },
  });
  return antonDatabase;
}

export function syncDatabaseToRemote() {
  const replicationConversationState = replicateRxCollection({
    collection: antonDatabase.conversations,
    replicationIdentifier: "conversations",
    deletedField: "deleted",
    live: true,
    autoStart: true,
    waitForLeadership: true,
    push: {
      batchSize: 10,
      handler: async (doc) => {
        const resp = await fetch("/api/replication/conversations", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(doc),
        });
        console.log("push conversation: ", doc);
        return [];
      },
    },
    pull: {
      handler: async (checkpointOrNull: any, batchSize) => {
        console.log("pull conversation", checkpointOrNull, batchSize);
        const updatedAt =
          checkpointOrNull?.updatedAt || new Date(0).toISOString();
        const resp = await fetch(
          `/api/replication/conversations?batchSize=${batchSize}&updatedAt=${updatedAt}`,
          {
            method: "GET",
          }
        );
        const { checkpoint, documents } = (await resp.json()) as {
          checkpoint: any;
          documents: any[];
        };
        return {
          checkpoint,
          documents,
        };
      },
    },
  });

  const replicationMessageState = replicateRxCollection({
    collection: antonDatabase.messages,
    replicationIdentifier: "messages",
    deletedField: "deleted",
    live: true,
    autoStart: true,
    waitForLeadership: true,
    push: {
      batchSize: 10,
      handler: async (doc) => {
        const resp = await fetch("/api/replication/messages", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(doc),
        });
        console.log("push messages", doc);
        return [];
      },
    },
    pull: {
      handler: async (checkpointOrNull: any, batchSize) => {
        console.log("pull messages", checkpointOrNull, batchSize);
        const offset = checkpointOrNull?.offset || 0;
        const resp = await fetch(
          `/api/replication/messages?batchSize=${batchSize}&offset=${offset}`,
          {
            method: "GET",
          }
        );
        const { checkpoint, documents } = (await resp.json()) as {
          checkpoint: any;
          documents: any[];
        };
        return {
          checkpoint,
          documents,
        };
      },
    },
  });

  const replicationUserState = replicateRxCollection({
    collection: antonDatabase.users,
    replicationIdentifier: "users",
    deletedField: "deleted",
    live: true,
    autoStart: true,
    waitForLeadership: true,
    push: {
      batchSize: 10,
      handler: async (doc) => {
        const resp = await fetch("/api/replication/users", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(doc),
        });
        console.log("push user: ", doc);
        return [];
      },
    },
    pull: {
      handler: async (checkpointOrNull: any, batchSize) => {
        console.log("pull user", checkpointOrNull, batchSize);
        const offset = checkpointOrNull?.offset || 0;
        const resp = await fetch(
          `/api/replication/users?batchSize=${batchSize}&offset=${offset}`,
          {
            method: "GET",
          }
        );
        const { checkpoint, documents } = (await resp.json()) as {
          checkpoint: any;
          documents: any[];
        };
        return {
          checkpoint,
          documents,
        };
      },
    },
  });

  return {
    replicationConversationState,
    replicationMessageState,
    replicationUserState,
  };
}
