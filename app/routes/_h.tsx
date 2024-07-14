import { LoaderFunctionArgs } from "@remix-run/cloudflare";
import {
  Outlet,
  NavLink,
  useMatches,
  ClientLoaderFunctionArgs,
} from "@remix-run/react";
import clsx from "clsx";
import { BotIcon, ImageIcon, MessageSquareIcon, UserIcon } from "lucide-react";
import { buttonVariants } from "~/components/ui/button";
import { cn } from "~/lib/utils";
import { getUserId } from "~/.server/session";
import { syncDatabaseToRemote } from "~/.client/db";

export async function loader({ request, context }: LoaderFunctionArgs) {
  const env = context.cloudflare.env;
  const userId = await getUserId(env, request);
  return {
    userId,
  };
}

export async function clientLoader({ serverLoader }: ClientLoaderFunctionArgs) {
  const data = await serverLoader<typeof loader>();
  if (data.userId) {
    console.log("Syncing database to remote...");
    syncDatabaseToRemote();
  }
  return data;
}

export default function HomeLayout() {
  const matches = useMatches();
  const isHomeRoot = !matches.some(
    (match) => match.id === "routes/_h.chat.$id"
  );

  return (
    <div className="h-dvh w-screen flex flex-col sm:flex-row">
      <div className="p-2 hidden sm:flex border-r flex-col gap-8">
        <div className="mx-auto">
          <BotIcon className="size-8" />
        </div>
        <div className="flex flex-col gap-4">
          <NavLink
            unstable_viewTransition
            prefetch="viewport"
            to="/chat"
            className={({ isActive }) => {
              return clsx(
                `${buttonVariants({ variant: "ghost", size: "icon" })}`,
                {
                  "bg-muted": isActive,
                }
              );
            }}
          >
            <MessageSquareIcon />
          </NavLink>
          <NavLink
            unstable_viewTransition
            prefetch="viewport"
            to="/image"
            className={({ isActive }) => {
              return clsx(
                `${buttonVariants({ variant: "ghost", size: "icon" })}`,
                {
                  "bg-muted": isActive,
                }
              );
            }}
          >
            <ImageIcon />
          </NavLink>
          <NavLink
            unstable_viewTransition
            prefetch="viewport"
            to="/account"
            className={({ isActive }) => {
              return clsx(
                `${buttonVariants({ variant: "ghost", size: "icon" })}`,
                {
                  "bg-muted": isActive,
                }
              );
            }}
          >
            <UserIcon />
          </NavLink>
        </div>
      </div>
      <div className="flex-1 w-full h-full overflow-x-hidden">
        <Outlet />
      </div>
      <div
        className={cn("flex sm:hidden items-center gap-4 w-full p-2", {
          hidden: !isHomeRoot,
        })}
      >
        <NavLink
          unstable_viewTransition
          prefetch="viewport"
          to="/chat"
          className={({ isActive }) => {
            return clsx("w-full", `${buttonVariants({ variant: "ghost" })}`, {
              "bg-muted": isActive,
            });
          }}
        >
          <MessageSquareIcon />
        </NavLink>
        <NavLink
          unstable_viewTransition
          prefetch="viewport"
          to="/image"
          className={({ isActive }) => {
            return clsx(
              "w-full",
              `${buttonVariants({ variant: "ghost", size: "icon" })}`,
              {
                "bg-muted": isActive,
              }
            );
          }}
        >
          <ImageIcon />
        </NavLink>
        <NavLink
          unstable_viewTransition
          prefetch="viewport"
          to="/account"
          className={({ isActive }) => {
            return clsx(
              "w-full",
              `${buttonVariants({ variant: "ghost", size: "icon" })}`,
              {
                "bg-muted": isActive,
              }
            );
          }}
        >
          <UserIcon />
        </NavLink>
      </div>
    </div>
  );
}
