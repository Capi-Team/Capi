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
      router.push("/auth/login");
      router.refresh();
      setIsLoading(false);
    }
  }

  return (
    <Button type="button" variant="outline" disabled={isLoading} onClick={handleLogout}>
      {isLoading ? "Cerrando..." : "Cerrar sesión"}
    </Button>
  );
}
