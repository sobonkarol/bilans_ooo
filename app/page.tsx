"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function Home() {
  const { status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    } else if (status === "authenticated") {
      router.push("/dashboard");
    }
  }, [status, router]);

  return (
    <div className="min-h-screen bg-(--bg-canvas) flex items-center justify-center">
      <div className="text-center">
        <p className="text-(--text-muted) mb-4">Ładowanie...</p>
      </div>
    </div>
  );
}
