"use client";

import Link from "next/link";
import { FormEvent, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { parseAuthRegisterClientPayload } from "@/lib/api/client-parsers";
import { MIN_PASSWORD_LENGTH } from "@/lib/auth/constants";
import { isValidEmail } from "@/lib/auth/validators";
import { readJsonUnknownFromResponse } from "@/lib/http/json";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

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
      setError("Completa todos los campos.");
      return;
    }

    if (!emailIsValid) {
      setError("Ingresa un correo válido.");
      return;
    }

    if (password.length < MIN_PASSWORD_LENGTH) {
      setError("La contraseña debe tener al menos 8 caracteres.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden.");
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
        setError(data?.message ?? "No se pudo completar el registro.");
        return;
      }

      setSuccess(data.message);
      setPassword("");
      setConfirmPassword("");
    } catch {
      setError("No se pudo conectar con el servidor.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className="coffee-bg flex min-h-screen items-center justify-center p-4">
      <motion.div
        className="w-full max-w-md"
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      >
        <Card>
          <CardHeader>
            <CardTitle>Crear cuenta</CardTitle>
            <CardDescription>Regístrate con tu correo y una contraseña segura.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={onSubmit} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-[var(--coffee-dark)]" htmlFor="email">
                  Correo
                </label>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-[var(--coffee-dark)]" htmlFor="password">
                  Contraseña
                </label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    required
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[var(--coffee-muted)]"
                    onClick={() => setShowPassword((prev) => !prev)}
                  >
                    {showPassword ? "Ocultar" : "Ver"}
                  </button>
                </div>
                <p className="text-xs text-[var(--coffee-muted)]">
                  Mínimo {MIN_PASSWORD_LENGTH} caracteres.
                </p>
              </div>

              <div className="space-y-2">
                <label
                  className="text-sm font-medium text-[var(--coffee-dark)]"
                  htmlFor="confirmPassword"
                >
                  Confirmar contraseña
                </label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    autoComplete="new-password"
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    required
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[var(--coffee-muted)]"
                    onClick={() => setShowConfirmPassword((prev) => !prev)}
                  >
                    {showConfirmPassword ? "Ocultar" : "Ver"}
                  </button>
                </div>
              </div>

              <motion.div layout className="min-h-[1.25rem] space-y-1">
                {error ? (
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-sm text-red-600"
                  >
                    {error}
                  </motion.p>
                ) : null}
                {success ? (
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-sm text-emerald-800"
                  >
                    {success}
                  </motion.p>
                ) : null}
              </motion.div>

              <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? "Registrando..." : "Registrarme"}
                </Button>
              </motion.div>
            </form>

            <p className="mt-6 text-sm text-[var(--coffee-muted)]">
              ¿Ya tienes cuenta?{" "}
              <Link href="/auth/login" className="font-medium text-[var(--coffee-accent)] underline">
                Inicia sesión
              </Link>
            </p>
          </CardContent>
        </Card>
      </motion.div>
    </main>
  );
}
