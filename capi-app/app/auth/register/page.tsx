"use client";

import Link from "next/link";
import { FormEvent, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

const MIN_PASSWORD_LENGTH = 8;
const SPECIAL_CHARACTERS = "!@#$%^&*()_+-=[]{}|;:,.<>?";
const SPECIAL_CHAR_REGEX = /[!@#$%^&*()_+\-=[\]{}|;:,.<>?]/;

export default function RegisterPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const emailIsValid = useMemo(() => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email), [email]);

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

    if (!SPECIAL_CHAR_REGEX.test(password)) {
      setError(`La contraseña debe incluir al menos un caracter especial: ${SPECIAL_CHARACTERS}`);
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
      let data: { success?: boolean; message?: string } = {};
      try {
        data = (await response.json()) as { success?: boolean; message?: string };
      } catch {
        data = {};
      }

      if (!response.ok || !data.success) {
        setError(data.message || "No se pudo completar el registro.");
        return;
      }

      setSuccess(data.message || "Registro creado correctamente.");
      setPassword("");
      setConfirmPassword("");
    } catch {
      setError("No se pudo conectar con el servidor.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className="magic-sky flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Crear cuenta</CardTitle>
          <CardDescription>Regístrate con tu correo corporativo.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-[#2f3d5f]" htmlFor="email">
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
              <label className="text-sm font-medium text-[#2f3d5f]" htmlFor="password">
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
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#4f5f82]"
                  onClick={() => setShowPassword((prev) => !prev)}
                >
                  {showPassword ? "Ocultar" : "Ver"}
                </button>
              </div>
              <p className="text-xs text-[#4f5f82]">
                Mínimo {MIN_PASSWORD_LENGTH} caracteres y al menos un caracter especial (
                {SPECIAL_CHARACTERS}).
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-[#2f3d5f]" htmlFor="confirmPassword">
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
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#4f5f82]"
                  onClick={() => setShowConfirmPassword((prev) => !prev)}
                >
                  {showConfirmPassword ? "Ocultar" : "Ver"}
                </button>
              </div>
            </div>

            {error ? <p className="text-sm text-red-600">{error}</p> : null}
            {success ? <p className="text-sm text-emerald-800">{success}</p> : null}

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Registrando..." : "Registrarme"}
            </Button>
          </form>


          <p className="mt-6 text-sm text-[#4f5f82]">
            ¿Ya tienes cuenta?{" "}
            <Link href="/auth/login" className="font-medium text-[#b86d12] underline">
              Inicia sesión
            </Link>
          </p>
        </CardContent>
      </Card>
    </main>
  );
}
