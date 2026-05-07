"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import type { FormEvent } from "react";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { parseAuthLoginClientPayload } from "@/lib/api/client-parsers";
import { readJsonUnknownFromResponse } from "@/lib/http/json";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AuthShell } from "@/components/auth/auth-shell";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const externalError = searchParams.get("error");
    if (externalError === "session_invalid") {
      setError("Your session is invalid. Please sign in again.");
    }
  }, [searchParams]);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (!email || !password) {
      setError("Enter both email and password.");
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "login",
          email,
          password,
        }),
      });
      const raw = await readJsonUnknownFromResponse(response);
      const data = parseAuthLoginClientPayload(raw);
      if (!data || !data.success) {
        setError(data?.message ?? "Invalid credentials.");
        return;
      }

      router.push(data.redirectTo);
      router.refresh();
    } catch {
      setError("Could not reach the server.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <AuthShell
      eyebrow="Welcome Back"
      title="Sign in to your training workspace"
      description="Access onboarding paths, interactive lessons and employee progress in one place."
      footer={
        <>
          No account yet?{" "}
          <Link href="/auth/register" className="font-medium text-white underline">
            Create one
          </Link>
        </>
      }
    >
            <form onSubmit={onSubmit} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-200" htmlFor="email">
                  Email
                </label>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                  className="h-12 rounded-xl border-white/15 bg-white/5 text-white placeholder:text-zinc-500"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-200" htmlFor="password">
                  Password
                </label>
                <Input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                  className="h-12 rounded-xl border-white/15 bg-white/5 text-white placeholder:text-zinc-500"
                />
              </div>

              <motion.div layout className="min-h-[1.25rem]">
                {error ? (
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-sm text-rose-300"
                  >
                    {error}
                  </motion.p>
                ) : null}
              </motion.div>

              <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
                <Button
                  type="submit"
                  className="h-12 w-full rounded-xl border border-white/30 bg-white text-black hover:bg-zinc-200"
                  disabled={isLoading}
                >
                  {isLoading ? "Signing in…" : "Sign in"}
                </Button>
              </motion.div>
            </form>
    </AuthShell>
  );
}
