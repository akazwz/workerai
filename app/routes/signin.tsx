import { LoaderFunctionArgs } from "@remix-run/cloudflare";
import { Link, useLoaderData } from "@remix-run/react";
import { BotIcon } from "lucide-react";
import { GitHubLogoIcon } from "@radix-ui/react-icons";
import { Button } from "~/components/ui/button";

export async function loader({ context }: LoaderFunctionArgs) {
  const clientId = context.cloudflare.env.GITHUB_CLIENT_ID;
  return {
    githubUrl: `https://github.com/login/oauth/authorize?client_id=${clientId}&scope=user:email public_repo`,
  };
}

export default function Login() {
  const { githubUrl } = useLoaderData<typeof loader>();

  return (
    <div className="flex gap-2 w-full h-dvh p-4 md:p-8 mx-auto">
      <div className="absolute inset-0 bg-primary z-0 p-8"></div>
      <div className="max-w-3xl rounded-md w-full mx-auto z-10 flex flex-col gap-8 p-10 justify-center md:justify-normal bg-primary-foreground">
        <BotIcon className="size-12 hidden md:block" />
        <div className="flex flex-col w-full gap-8 p-4 mx-auto max-w-md items-center">
          <BotIcon className="size-12 md:hidden" />
          <h1 className="font-semibold text-2xl">Welcome to Anton AI.</h1>
          <Button asChild size="lg">
            <Link to={githubUrl} target="_blank">
              <GitHubLogoIcon className="size-6 mx-4" />
              Sign in with GitHub
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
