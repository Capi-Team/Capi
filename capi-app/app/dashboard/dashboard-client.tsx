"use client";

import type { WorkspaceRole } from "@prisma/client";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  parseWorkspaceCreateClientPayload,
  parseWorkspaceJoinClientPayload,
} from "@/lib/api/client-parsers";
import { readJsonUnknownFromResponse } from "@/lib/http/json";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export type WorkspaceRow = {
  id: number;
  name: string;
  role: WorkspaceRole;
  inviteCode: string | null;
};

type DashboardClientProps = {
  email: string;
  workspaces: WorkspaceRow[];
};

export default function DashboardClient({ email, workspaces }: DashboardClientProps) {
  const router = useRouter();
  const [createName, setCreateName] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [busy, setBusy] = useState<"create" | "join" | null>(null);
  const [message, setMessage] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  async function onCreate(e: FormEvent) {
    e.preventDefault();
    setMessage(null);
    if (!createName.trim()) {
      setMessage({ type: "err", text: "Escribe un nombre para el entorno." });
      return;
    }
    setBusy("create");
    try {
      const res = await fetch("/api/workspaces", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: createName.trim() }),
      });
      const raw = await readJsonUnknownFromResponse(res);
      const data = parseWorkspaceCreateClientPayload(raw);
      if (!data || !data.success) {
        setMessage({ type: "err", text: data?.message ?? "No se pudo crear el entorno." });
        return;
      }
      setCreateName("");
      setMessage({ type: "ok", text: "Entorno creado. Eres el propietario." });
      router.refresh();
    } catch {
      setMessage({ type: "err", text: "Error de red." });
    } finally {
      setBusy(null);
    }
  }

  async function onJoin(e: FormEvent) {
    e.preventDefault();
    setMessage(null);
    if (!joinCode.trim()) {
      setMessage({ type: "err", text: "Ingresa el código de invitación." });
      return;
    }
    setBusy("join");
    try {
      const res = await fetch("/api/workspaces/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ inviteCode: joinCode.trim() }),
      });
      const raw = await readJsonUnknownFromResponse(res);
      const data = parseWorkspaceJoinClientPayload(raw);
      if (!data || !data.success) {
        setMessage({ type: "err", text: data?.message ?? "No se pudo unir al entorno." });
        return;
      }
      setJoinCode("");
      setMessage({
        type: "ok",
        text: data.alreadyMember ? "Ya formas parte de ese entorno." : "Te uniste como miembro.",
      });
      router.refresh();
    } catch {
      setMessage({ type: "err", text: "Error de red." });
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="coffee-bg-muted min-h-[calc(100vh-4rem)] p-6">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="mx-auto max-w-4xl"
      >
        <h1 className="text-2xl font-semibold text-[var(--coffee-dark)]">Panel</h1>
        <p className="mt-1 text-sm text-[var(--coffee-muted)]">
          Sesión iniciada como <span className="font-medium text-[var(--coffee-ink)]">{email}</span>
        </p>

        {message ? (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className={`mt-4 text-sm ${message.type === "ok" ? "text-emerald-800" : "text-red-700"}`}
          >
            {message.text}
          </motion.p>
        ) : null}

        <div className="mt-8 grid gap-6 md:grid-cols-2">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05, duration: 0.35 }}
            whileHover={{ y: -2 }}
          >
            <Card className="coffee-surface h-full border-[var(--coffee-border)] shadow-sm">
              <CardHeader>
                <CardTitle className="text-[var(--coffee-dark)]">Crear un entorno de trabajo</CardTitle>
                <CardDescription className="text-[var(--coffee-muted)]">
                  Serás propietario (OWNER) y podrás compartir el código de invitación.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={onCreate} className="space-y-3">
                  <Input
                    placeholder="Nombre del equipo o proyecto"
                    value={createName}
                    onChange={(ev) => setCreateName(ev.target.value)}
                    autoComplete="off"
                  />
                  <Button type="submit" className="w-full" disabled={busy === "create"}>
                    {busy === "create" ? "Creando..." : "Crear entorno"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.35 }}
            whileHover={{ y: -2 }}
          >
            <Card className="coffee-surface h-full border-[var(--coffee-border)] shadow-sm">
              <CardHeader>
                <CardTitle className="text-[var(--coffee-dark)]">Entrar a un entorno de trabajo</CardTitle>
                <CardDescription className="text-[var(--coffee-muted)]">
                  Pide el código al administrador. Entrarás como miembro (MEMBER).
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={onJoin} className="space-y-3">
                  <Input
                    placeholder="Código de invitación"
                    value={joinCode}
                    onChange={(ev) => setJoinCode(ev.target.value)}
                    autoComplete="off"
                  />
                  <Button type="submit" className="w-full" disabled={busy === "join"}>
                    {busy === "join" ? "Uniendo..." : "Unirme con código"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {workspaces.length > 0 ? (
          <motion.section
            className="mt-10"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.15, duration: 0.35 }}
          >
            <h2 className="text-lg font-semibold text-[var(--coffee-dark)]">Tus entornos</h2>
            <ul className="mt-3 space-y-2">
              {workspaces.map((w, i) => (
                <motion.li
                  key={w.id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.08 + i * 0.04, duration: 0.3 }}
                  className="coffee-card-muted flex flex-wrap items-center justify-between gap-2 rounded-xl px-4 py-3"
                >
                  <div>
                    <p className="font-medium text-[var(--coffee-dark)]">{w.name}</p>
                    <p className="text-xs text-[var(--coffee-muted)]">Rol: {w.role}</p>
                  </div>
                  {w.inviteCode ? (
                    <span className="rounded-md bg-[var(--coffee-cream)] px-2 py-1 font-mono text-xs text-[var(--coffee-dark)]">
                      {w.inviteCode}
                    </span>
                  ) : null}
                </motion.li>
              ))}
            </ul>
          </motion.section>
        ) : null}
      </motion.div>
    </div>
  );
}
