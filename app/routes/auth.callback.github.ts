import { Octokit } from "@octokit/rest";
import { exchangeWebFlowCode } from "@octokit/oauth-methods";
import { LoaderFunctionArgs, redirect } from "@remix-run/cloudflare";
import { eq } from "drizzle-orm";
import { sessionWrapper } from "~/.server/session";
import { dbWrapper, schema } from "~/.server/db";

export async function loader({ request, context }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  if (!code) {
    throw new Response("Authorization code not found", { status: 400 });
  }
  const result = await exchangeWebFlowCode({
    clientType: "oauth-app",
    clientId: context.cloudflare.env.GITHUB_CLIENT_ID,
    clientSecret: context.cloudflare.env.GITHUB_CLIENT_SECRET,
    code: code,
  });
  const githubAccessToken = result.authentication.token;

  const octokit = new Octokit({
    auth: githubAccessToken,
  });
  const { data: userData } = await octokit.rest.users.getAuthenticated();
  const { data: emails } =
    await octokit.rest.users.listEmailsForAuthenticatedUser();
  const primaryEmail = emails.find((email) => email.primary);
  const email = primaryEmail ? primaryEmail.email : null;
  if (!email) {
    throw new Response("Primary email not found", { status: 400 });
  }
  const db = dbWrapper(context.cloudflare.env.DB);
  // get or create user
  let user;
  try {
    user = await db.query.users.findFirst({
      where: eq(schema.users.email, email),
    });
  } catch (error) {
    console.error(error);
  }

  if (!user) {
    const insetResult = await db
      .insert(schema.users)
      .values({
        name: userData.name,
        email: email,
        avatar: userData.avatar_url,
      })
      .returning();
    if (insetResult.length !== 1) {
      throw new Response("Failed to create user", { status: 500 });
    }
    user = insetResult[0];
  }
  const env = context.cloudflare.env;
  const { KV, SESSION_SECRET } = env;
  const { getSession, commitSession } = sessionWrapper(KV, SESSION_SECRET);
  const session = await getSession(request.headers.get("Cookie"));
  session.set("userId", user.id);
  await commitSession(session);
  // addons githubAccessToken
  await KV.put(
    `addons:${user.id}`,
    JSON.stringify({
      githubAccessToken,
    })
  );
  return redirect("/chat");
}
