"use client";

import type { WorkspaceRole } from "@prisma/client";
import type { FormEvent } from "react";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  parseWorkspaceCreateClientPayload,
  parseWorkspaceJoinClientPayload,
  parseWorkspaceSelectClientPayload,
} from "@/lib/api/client-parsers";
import { readJsonUnknownFromResponse } from "@/lib/http/json";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MouseTiltCard } from "@/components/ui/mouse-tilt-card";

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

function normalizeWorkspaceName(value: string): string {
  return value.trim().toLowerCase();
}

function workspaceNameTakenLocally(name: string, list: WorkspaceRow[]): boolean {
  const target = normalizeWorkspaceName(name);
  return list.some((w) => normalizeWorkspaceName(w.name) === target);
}

function ClipboardIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={14}
      height={14}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <rect width={14} height={14} x={8} y={8} rx={2} ry={2} />
      <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
    </svg>
  );
}

export default function DashboardClient({ email, workspaces }: DashboardClientProps) {
  const router = useRouter();
  const [createName, setCreateName] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [busy, setBusy] = useState<"create" | "join" | null>(null);
  const [openingWorkspaceId, setOpeningWorkspaceId] = useState<number | null>(null);
  const [copiedInviteWorkspaceId, setCopiedInviteWorkspaceId] = useState<number | null>(null);
  const copyResetTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const [message, setMessage] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  async function copyInviteCode(workspaceId: number, code: string) {
    try {
      await navigator.clipboard.writeText(code);
      if (copyResetTimeoutRef.current !== undefined) {
        clearTimeout(copyResetTimeoutRef.current);
      }
      setCopiedInviteWorkspaceId(workspaceId);
      copyResetTimeoutRef.current = setTimeout(() => {
        setCopiedInviteWorkspaceId((current) =>
          current === workspaceId ? null : current
        );
        copyResetTimeoutRef.current = undefined;
      }, 2000);
    } catch {
      setMessage({
        type: "err",
        text: "Could not copy the code. Select it manually or check browser permissions.",
      });
    }
  }

  async function onCreate(event: FormEvent) {
    event.preventDefault();
    setMessage(null);
    const trimmed = createName.trim();
    if (!trimmed) {
      setMessage({ type: "err", text: "Enter a workspace name." });
      return;
    }
    if (workspaceNameTakenLocally(trimmed, workspaces)) {
      setMessage({
        type: "err",
        text: "You already have a workspace with this name. Choose another name or open it below.",
      });
      return;
    }

    setBusy("create");
    try {
      const res = await fetch("/api/workspaces", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: trimmed }),
      });
      const raw = await readJsonUnknownFromResponse(res);
      const data = parseWorkspaceCreateClientPayload(raw);
      if (!data || !data.success) {
        setMessage({
          type: "err",
          text: data?.message ?? "Could not create the workspace.",
        });
        return;
      }
      setCreateName("");
      setMessage({
        type: "ok",
        text: "Workspace created. You are the owner. Redirecting…",
      });
      router.push(data.redirectTo);
      router.refresh();
    } catch {
      setMessage({ type: "err", text: "Network error." });
    } finally {
      setBusy(null);
    }
  }

  async function onJoin(event: FormEvent) {
    event.preventDefault();
    setMessage(null);
    if (!joinCode.trim()) {
      setMessage({ type: "err", text: "Enter the invite code." });
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
        setMessage({
          type: "err",
          text: data?.message ?? "Could not join the workspace.",
        });
        return;
      }
      setJoinCode("");
      setMessage({
        type: "ok",
        text: data.alreadyMember
          ? "You are already in that workspace. Redirecting…"
          : "Joined as a member. Redirecting…",
      });
      router.push(data.redirectTo);
      router.refresh();
    } catch {
      setMessage({ type: "err", text: "Network error." });
    } finally {
      setBusy(null);
    }
  }

  async function openWorkspace(workspaceId: number) {
    setMessage(null);
    setOpeningWorkspaceId(workspaceId);
    try {
      const res = await fetch("/api/workspaces/select", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workspaceId }),
      });
      const raw = await readJsonUnknownFromResponse(res);
      const data = parseWorkspaceSelectClientPayload(raw);
      if (!data || !data.success) {
        setMessage({
          type: "err",
          text: data?.message ?? "Could not open the workspace.",
        });
        return;
      }
      router.push(data.redirectTo);
      router.refresh();
    } catch {
      setMessage({ type: "err", text: "Network error." });
    } finally {
      setOpeningWorkspaceId(null);
    }
  }

  const ownerCount = workspaces.filter((workspace) => workspace.role === "OWNER").length;
  const memberCount = workspaces.length - ownerCount;

  return (
    <div className="min-h-[calc(100vh-4rem)] p-6">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="mx-auto max-w-6xl"
      >
        <section className="relative overflow-hidden rounded-[1.8rem] border border-white/12 bg-[radial-gradient(circle_at_10%_15%,#1e1e1e_0%,#101010_40%,#070707_100%)] p-8 shadow-[0_30px_70px_rgba(0,0,0,0.35)]">
          <div className="absolute -right-20 -top-16 h-56 w-56 rounded-full bg-[radial-gradient(circle,rgba(255,255,255,0.25)_0%,rgba(255,255,255,0)_75%)] blur-lg" />
          <motion.p
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative text-xs uppercase tracking-[0.28em] text-zinc-400"
          >
            Control center
          </motion.p>
          <h1 className="relative mt-3 text-4xl font-semibold leading-tight text-white sm:text-5xl">
            Workspace Hub
            <br />
            interactive.
          </h1>
          <p className="relative mt-4 max-w-2xl text-sm leading-relaxed text-zinc-300 sm:text-base">
            Manage your workspaces with a visual interface, fast actions, and animated feedback
            in every creation, access, and collaboration flow.
          </p>
          <p className="relative mt-4 text-sm text-zinc-400">
            Signed in as <span className="font-medium text-zinc-200">{email}</span>
          </p>
          <div className="relative mt-8 grid gap-3 sm:grid-cols-3">
            <MouseTiltCard className="landing-glass rounded-xl px-4 py-3">
              <p className="text-xs uppercase tracking-[0.2em] text-zinc-400">Total</p>
              <p className="mt-1 text-2xl font-semibold text-white">{workspaces.length}</p>
            </MouseTiltCard>
            <MouseTiltCard className="landing-glass rounded-xl px-4 py-3">
              <p className="text-xs uppercase tracking-[0.2em] text-zinc-400">Owner</p>
              <p className="mt-1 text-2xl font-semibold text-white">{ownerCount}</p>
            </MouseTiltCard>
            <MouseTiltCard className="landing-glass rounded-xl px-4 py-3">
              <p className="text-xs uppercase tracking-[0.2em] text-zinc-400">Member</p>
              <p className="mt-1 text-2xl font-semibold text-white">{memberCount}</p>
            </MouseTiltCard>
          </div>
        </section>

        {message ? (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className={`mt-4 text-sm ${message.type === "ok" ? "text-emerald-300" : "text-rose-300"}`}
          >
            {message.text}
          </motion.p>
        ) : null}

        <div className="mt-8 grid gap-6 md:grid-cols-2">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05, duration: 0.35 }}
            whileHover={{ y: -3 }}
          >
            <MouseTiltCard className="landing-glass h-full rounded-2xl p-6">
              <div className="mb-4">
                <h3 className="text-xl font-semibold text-white">Create a workspace</h3>
                <p className="mt-1 text-sm text-zinc-400">
                  You become the owner and can share an invite code with your team.
                </p>
              </div>
              <div>
                <form onSubmit={onCreate} className="space-y-3">
                  <Input
                    placeholder="Team or project name"
                    value={createName}
                    onChange={(ev) => setCreateName(ev.target.value)}
                    autoComplete="off"
                    className="h-11 rounded-xl border-white/15 bg-white/5 text-white placeholder:text-zinc-500"
                  />
                  <Button
                    type="submit"
                    className="h-11 w-full rounded-xl border border-white/25 bg-white text-sm text-black hover:bg-zinc-200"
                    disabled={busy === "create"}
                  >
                    {busy === "create" ? "Creating…" : "Create workspace"}
                  </Button>
                </form>
              </div>
            </MouseTiltCard>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.35 }}
            whileHover={{ y: -3 }}
          >
            <MouseTiltCard className="landing-glass h-full rounded-2xl p-6">
              <div className="mb-4">
                <h3 className="text-xl font-semibold text-white">Join a workspace</h3>
                <p className="mt-1 text-sm text-zinc-400">
                  Ask an admin for the invite code. You join as a member.
                </p>
              </div>
              <div>
                <form onSubmit={onJoin} className="space-y-3">
                  <Input
                    placeholder="Invite code"
                    value={joinCode}
                    onChange={(ev) => setJoinCode(ev.target.value)}
                    autoComplete="off"
                    className="h-11 rounded-xl border-white/15 bg-white/5 text-white placeholder:text-zinc-500"
                  />
                  <Button
                    type="submit"
                    className="h-11 w-full rounded-xl border border-white/20 bg-white/10 text-sm text-white hover:bg-white/20"
                    disabled={busy === "join"}
                  >
                    {busy === "join" ? "Joining…" : "Join with code"}
                  </Button>
                </form>
              </div>
            </MouseTiltCard>
          </motion.div>
        </div>

        {workspaces.length > 0 ? (
          <motion.section
            className="mt-10"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.15, duration: 0.35 }}
          >
            <h2 className="text-lg font-semibold text-white">Your workspaces</h2>
            <ul className="mt-3 space-y-3">
              {workspaces.map((w, i) => {
                const inviteCode = w.inviteCode;
                return (
                  <motion.li
                    key={w.id}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.08 + i * 0.04, duration: 0.3 }}
                    className="list-none"
                  >
                    <MouseTiltCard className="landing-glass flex flex-wrap items-center justify-between gap-3 rounded-2xl px-4 py-4">
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-white">{w.name}</p>
                        <p className="text-xs text-zinc-400">Role: {w.role}</p>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        {inviteCode ? (
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="rounded-md border border-white/15 bg-white/10 px-2 py-1 font-mono text-xs text-zinc-100">
                              {inviteCode}
                            </span>
                            <Button
                              type="button"
                              variant="outline"
                              className="h-9 shrink-0 gap-1.5 border-white/20 bg-white/10 px-3 text-xs text-zinc-100 hover:bg-white/20"
                              onClick={() => void copyInviteCode(w.id, inviteCode)}
                              aria-label="Copy workspace invite code"
                            >
                              <ClipboardIcon className="shrink-0 opacity-80" />
                              {copiedInviteWorkspaceId === w.id ? "Copied!" : "Copy code"}
                            </Button>
                          </div>
                        ) : null}
                        <Button
                          type="button"
                          variant="outline"
                          className="h-9 shrink-0 border-white/20 bg-white/10 px-3 text-xs text-zinc-100 hover:bg-white/20"
                          disabled={openingWorkspaceId === w.id}
                          onClick={() => openWorkspace(w.id)}
                        >
                          {openingWorkspaceId === w.id ? "Opening…" : "Go to workspace"}
                        </Button>
                      </div>
                    </MouseTiltCard>
                  </motion.li>
                );
              })}
            </ul>
          </motion.section>
        ) : null}

      </motion.div>
    </div>
  );
}
