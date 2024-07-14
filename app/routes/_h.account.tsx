import {
  ImageIcon,
  MessageSquareIcon,
  RefreshCwOffIcon,
  RefreshCcwIcon,
  UserIcon,
  RocketIcon,
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "~/components/ui/alert";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "~/components/ui/carousel";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { antonDatabase } from "~/.client/db";
import { cn } from "~/lib/utils";
import { Button } from "~/components/ui/button";
import { Form, Link, useLoaderData } from "@remix-run/react";
import {
  ActionFunctionArgs,
  LoaderFunctionArgs,
  redirect,
} from "@remix-run/cloudflare";
import { getUser, getUserId, signOut } from "~/.server/session";

export async function loader({ request, context }: LoaderFunctionArgs) {
  const user = await getUser(context.cloudflare.env, request);
  return {
    user,
  };
}

export async function action({ request, context }: ActionFunctionArgs) {
  const userId = await getUserId(context.cloudflare.env, request);
  if (!userId) {
    return redirect("/signin");
  }
  await signOut(context.cloudflare.env, request);
  return redirect("/signin");
}

export default function AccountIndex() {
  const { user } = useLoaderData<typeof loader>();
  // const [user, setUser] = useState<UserDocType>();

  const plan = user?.plan || "trial";
  const plans = ["trial", "free", "pro"];
  const planIndex = plans.indexOf(plan);

  const planConfigs = [
    {
      plan: "trial",
      messages: 10,
      images: 5,
      sync: false,
    },
    {
      plan: "free",
      messages: 100,
      images: 50,
      sync: true,
    },
    {
      plan: "pro",
      messages: 1000,
      images: 100,
      sync: true,
    },
  ];

  async function clearDatabase() {
    await antonDatabase.destroy();
    await antonDatabase.remove();
  }

  return (
    <div className="flex items-center h-full p-4 flex-col gap-4 overflow-y-auto">
      <Avatar className="size-20">
        <AvatarImage src={user?.avatar || ""} alt="" />
        <AvatarFallback>
          <UserIcon className="size-12" />
        </AvatarFallback>
      </Avatar>
      <div className="flex flex-col">
        <h1 className="font-extrabold text-2xl uppercase">
          {user?.name || "Anonymous"}
        </h1>
        <span className="text-sm text-muted-foreground">{user?.email}</span>
      </div>
      <div>
        {user?.plan !== "pro" && (
          <Alert className="font-semibold">
            <RocketIcon className="size-4" />
            <AlertTitle>
              <Link
                target="_blank"
                to="https://github.com/akazwz/antonai"
                className="text-blue-500 font-bold underline underline-offset-4 decoration-2"
              >
                Give us a star
              </Link>
            </AlertTitle>
            <AlertDescription>
              Login with Github and gave us a star to get a free Pro plan.
            </AlertDescription>
          </Alert>
        )}
      </div>
      <Carousel
        className="md:hidden w-full"
        opts={{
          loop: true,
          startIndex: planIndex,
        }}
      >
        <CarouselContent>
          {planConfigs.map((planConfig) => (
            <CarouselItem className="basis-2/3" key={planConfig.plan}>
              <PlanCard {...planConfig} currentPlan={plan} />
            </CarouselItem>
          ))}
        </CarouselContent>
      </Carousel>
      <div className="md:grid-cols-3 gap-4 w-full max-w-4xl mx-auto hidden md:grid">
        {planConfigs.map((planConfig) => (
          <PlanCard {...planConfig} currentPlan={plan} key={planConfig.plan} />
        ))}
      </div>
      <div className="flex flex-col gap-4 w-full max-w-md">
        <Button size="lg" asChild className="w-full">
          <Link
            to="/signin"
            unstable_viewTransition
            className={cn({
              hidden: !!user?.id,
            })}
          >
            Sign In
          </Link>
        </Button>
        <Form method="POST" className="w-full flex flex-col">
          <Button
            size="lg"
            type="submit"
            className={cn({
              hidden: !user?.id,
            })}
          >
            Sign Out
          </Button>
        </Form>
        <Button
          type="button"
          variant="destructive"
          className="w-fit mx-auto"
          onClick={clearDatabase}
        >
          Reset
        </Button>
        <div></div>
      </div>
    </div>
  );
}

export interface PlanCardProps {
  currentPlan: string;
  plan: string;
  messages: number;
  images: number;
  sync: boolean;
}

export function PlanCard({
  currentPlan,
  plan,
  messages,
  images,
  sync,
}: PlanCardProps) {
  return (
    <div
      className={cn(
        "p-4 border-2 shadow-md text-xs rounded-lg flex flex-col gap-4",
        {
          "border-primary": plan === currentPlan,
          "text-muted-foreground": plan !== currentPlan,
        }
      )}
    >
      <span className="font-bold text-xl uppercase">{plan}</span>
      <div className="grid gap-1">
        <div className="flex items-center gap-2 font-semibold">
          <MessageSquareIcon />
          {messages} messages chat per day
        </div>
        <div className="flex items-center gap-2 font-semibold">
          <ImageIcon />
          {images} images per day
        </div>
        <div className="flex items-center gap-2 font-semibold">
          {sync ? <RefreshCcwIcon /> : <RefreshCwOffIcon />}
          {sync ? "Cloud sync" : "No cloud sync"}
        </div>
      </div>
    </div>
  );
}
