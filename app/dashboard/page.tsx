"use client";

import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function Dashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-(--bg-canvas) flex items-center justify-center">
        <p className="text-(--text-muted)">Ładowanie...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-(--bg-canvas)">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-(--text-strong)">Dashboard</h1>
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="px-4 py-2 bg-(--accent) hover:bg-(--accent-hover) text-white rounded transition"
          >
            Wyloguj się
          </button>
        </div>

        <div className="bg-(--bg-elevated) border border-(--surface-border) rounded-lg p-6 text-(--text-strong)">
          <h2 className="text-xl font-semibold mb-4">Witaj, {session?.user?.name || session?.user?.email}!</h2>
          <p className="text-(--text-muted)">
            To jest placeholder dashboard. Tu będzie główny interfejs aplikacji.
          </p>
        </div>
      </div>
    </div>
  );
}
