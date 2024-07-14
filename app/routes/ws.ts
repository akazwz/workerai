import { json, LoaderFunctionArgs } from "@remix-run/cloudflare";
import type { WebSocket } from "@cloudflare/workers-types";

export class WebSocketHibernationServer {
  state: DurableObjectState;

  sessions: Map<string, WebSocket>;

  constructor(state: DurableObjectState, env: Env) {
    this.state = state;
    this.sessions = new Map<string, WebSocket>();
  }

  async webSocketClose(
    ws: WebSocket,
    code: number,
    reason: string,
    wasClean: boolean
  ) {
    this.sessions.delete(ws.deserializeAttachment().username);
    console.log(`WebSocket closed: ${code} ${reason} ${wasClean}`);
  }

  async fetch(request: Request): Promise<Response> {
    console.log("fetch");
    const upgraderHeader = request.headers.get("Upgrade");
    if (!upgraderHeader || upgraderHeader.toLowerCase() !== "websocket") {
      return json({ error: "Not a WebSocket request" }, 400);
    }
    const [client, server] = Object.values(new WebSocketPair());
    this.state.acceptWebSocket(server);
    server.onmessage = (event) => {
      client.send(event.data);
    };
    return new Response(null, { status: 101, webSocket: client });
  }
}

export async function loader({ request, context }: LoaderFunctionArgs) {
  console.log("loader");
  let id: DurableObjectId =
    context.cloudflare.env.WEBSOCKET_HIBERNATION_SERVER.idFromName("foo");
  let stub: DurableObjectStub =
    context.cloudflare.env.WEBSOCKET_HIBERNATION_SERVER.get(id);
  return stub.fetch(request);
}
