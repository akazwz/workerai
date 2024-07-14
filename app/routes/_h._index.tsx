import { LoaderFunctionArgs, redirect } from "@remix-run/cloudflare";

export async function loader({}: LoaderFunctionArgs) {
  return redirect("/chat");
}
