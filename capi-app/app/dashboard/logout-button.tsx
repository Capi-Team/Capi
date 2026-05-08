"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";

export default function LogoutButton() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  async function handleLogout() {
    setIsLoading(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } finally {
      router.push("/");
      router.refresh();
      setIsLoading(false);
    }
  }

  return (
    <Button
      type="button"
      variant="outline"
      className="rounded-full border-white bg-white px-5 text-black hover:bg-zinc-200"
      disabled={isLoading}
      onClick={handleLogout}
    >
      {isLoading ? "Signing out…" : "Sign out"}
    </Button>
  );
}
