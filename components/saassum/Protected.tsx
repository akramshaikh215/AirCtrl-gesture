import { serverAuth } from "../../lib/saassum/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import Account from "./Account";
export default async function Protected({
  settings = false,
}: {
  settings?: boolean;
}) {
  const sb = await serverAuth();
  if (!sb)
    return (
      <div className="panel empty">
        <h2>Your workspace is almost ready.</h2>
        <p>
          Authentication is not configured yet. Add Supabase environment
          variables to enable private settings and history.
        </p>
        <Link href="/studio" className="button">
          Try the browser studio ↗
        </Link>
      </div>
    );
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user)
    redirect(
      "/auth/sign-in?next=" +
        encodeURIComponent(settings ? "/settings" : "/dashboard"),
    );
  return (
    <Account settings={settings} name={user.email?.split("@")[0] || "there"} />
  );
}
