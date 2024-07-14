import { json, LoaderFunctionArgs } from "@remix-run/cloudflare";
import {
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
} from "@remix-run/react";
import { cookieWrapper, sessionWrapper } from "~/.server/session";
import { Toaster } from "~/components/ui/sonner";
import "~/tailwind.css";

export async function loader({ request, context }: LoaderFunctionArgs) {
  try {
    const { KV, SESSION_SECRET } = context.cloudflare.env;
    const { getSession, commitSession } = sessionWrapper(KV, SESSION_SECRET);
    const cookieHeader = request.headers.get("Cookie");
    const session = await getSession(cookieHeader);
    const cookie = await cookieWrapper(SESSION_SECRET).parse(cookieHeader);
    const headers = new Headers();
    if (!cookie) {
      headers.append("Set-Cookie", await commitSession(session));
    }
    return json(null, {
      headers,
    });
  } catch (error) {
    return null;
  }
}

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="light">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body>
        {children}
        <ScrollRestoration />
        <Scripts />
        <Toaster richColors />
        <script
          defer
          src="https://u.pexni.com/script.js"
          data-website-id="94daf3bf-42a9-47d3-90f0-953b2b179daa"
        />
      </body>
    </html>
  );
}

export default function App() {
  return <Outlet />;
}
