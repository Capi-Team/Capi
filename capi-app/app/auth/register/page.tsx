"use client";

import Link from "next/link";
import type { FormEvent } from "react";
import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { parseAuthRegisterClientPayload } from "@/lib/api/client-parsers";
import { MIN_PASSWORD_LENGTH } from "@/lib/auth/constants";
import { isValidEmail } from "@/lib/auth/validators";
import { readJsonUnknownFromResponse } from "@/lib/http/json";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AuthShell } from "@/components/auth/auth-shell";

export default function RegisterPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const emailIsValid = useMemo(() => isValidEmail(email), [email]);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (!email || !password || !confirmPassword) {
      setError("Complete every field.");
      return;
    }

    if (!emailIsValid) {
      setError("Enter a valid email address.");
      return;
    }

    if (password.length < MIN_PASSWORD_LENGTH) {
      setError(`Password must be at least ${MIN_PASSWORD_LENGTH} characters.`);
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "register",
          email,
          password,
          confirmPassword,
        }),
      });
      const raw = await readJsonUnknownFromResponse(response);
      const data = parseAuthRegisterClientPayload(raw);
      if (!data || !data.success) {
        setError(data?.message ?? "Registration could not be completed.");
        return;
      }

      setSuccess(data.message);
      setPassword("");
      setConfirmPassword("");
    } catch {
      setError("Could not reach the server.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <AuthShell
      eyebrow="Create account"
      title="Start modern onboarding in minutes"
      description="Set up your account to launch role-based learning, AI-assisted guidance and progress analytics."
      footer={
        <>
          Already have an account?{" "}
          <Link href="/auth/login" className="font-medium text-white underline">
            Sign in
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
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    required
                    className="h-12 rounded-xl border-white/15 bg-white/5 pr-16 text-white placeholder:text-zinc-500"
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-zinc-300"
                    onClick={() => setShowPassword((prev) => !prev)}
                  >
                    {showPassword ? "Hide" : "Show"}
                  </button>
                </div>
                <p className="text-xs text-zinc-400">
                  At least {MIN_PASSWORD_LENGTH} characters.
                </p>
              </div>

              <div className="space-y-2">
                <label
                  className="text-sm font-medium text-zinc-200"
                  htmlFor="confirmPassword"
                >
                  Confirm password
                </label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    autoComplete="new-password"
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    required
                    className="h-12 rounded-xl border-white/15 bg-white/5 pr-16 text-white placeholder:text-zinc-500"
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-zinc-300"
                    onClick={() => setShowConfirmPassword((prev) => !prev)}
                  >
                    {showConfirmPassword ? "Hide" : "Show"}
                  </button>
                </div>
              </div>

              <motion.div layout className="min-h-[1.25rem] space-y-1">
                {error ? (
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-sm text-rose-300"
                  >
                    {error}
                  </motion.p>
                ) : null}
                {success ? (
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-sm text-emerald-300"
                  >
                    {success}
                  </motion.p>
                ) : null}
              </motion.div>

              <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
                <Button
                  type="submit"
                  className="h-12 w-full rounded-xl border border-white/30 bg-white text-black hover:bg-zinc-200"
                  disabled={isLoading}
                >
                  {isLoading ? "Creating account…" : "Register"}
                </Button>
              </motion.div>
            </form>
    </AuthShell>
  );
}
