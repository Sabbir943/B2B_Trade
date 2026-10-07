import { Suspense } from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import SignOutButton from "@/components/sign-out-button";

export const metadata = {
  title: "Dashboard",
};

export default function DashboardPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-zinc-50 px-4 py-12 dark:bg-black">
      <Suspense
        fallback={
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Loading your dashboard...
          </p>
        }
      >
        <Dashboard />
      </Suspense>
    </main>
  );
}

async function Dashboard() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/sign-in");
  }

  const { user } = session;

  return (
    <div className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
      <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
        Signed in as
      </p>
      <h1 className="mt-1 text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
        {user.name}
      </h1>
      <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
        {user.email}
      </p>

      <dl className="mt-6 grid grid-cols-2 gap-4 rounded-xl border border-zinc-200 p-4 text-sm dark:border-zinc-800">
        <div>
          <dt className="text-zinc-500 dark:text-zinc-400">User ID</dt>
          <dd className="mt-1 truncate font-medium text-zinc-900 dark:text-zinc-50">
            {user.id}
          </dd>
        </div>
        <div>
          <dt className="text-zinc-500 dark:text-zinc-400">Joined</dt>
          <dd className="mt-1 font-medium text-zinc-900 dark:text-zinc-50">
            {new Date(user.createdAt).toLocaleDateString()}
          </dd>
        </div>
      </dl>

      <div className="mt-6">
        <SignOutButton />
      </div>
    </div>
  );
}
