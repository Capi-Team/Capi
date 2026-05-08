"use client";

import type { WorkspaceRole } from "@prisma/client";
import type { ChangeEvent, FormEvent } from "react";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
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
  imageUrl: string | null;
  role: WorkspaceRole;
  inviteCode: string | null;
};

type DashboardClientProps = {
  email: string;
  profileBio: string | null;
  avatarUrl: string | null;
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

function EditIcon({ className }: { className?: string }) {
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
      <path d="M12 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.4 2.6a2.1 2.1 0 1 1 3 3L12 15l-4 1 1-4 9.4-9.4z" />
    </svg>
  );
}

function TrashIcon({ className }: { className?: string }) {
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
      <path d="M3 6h18" />
      <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
      <path d="M10 11v6M14 11v6" />
    </svg>
  );
}

function ImageIcon({ className }: { className?: string }) {
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
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
      <circle cx="9" cy="9" r="2" />
      <path d="m21 15-3.1-3.1a2 2 0 0 0-2.8 0L6 21" />
    </svg>
  );
}

function SettingsIcon({ className }: { className?: string }) {
  return (
    <span className={className} aria-hidden>
      ⚙
    </span>
  );
}

export default function DashboardClient({
  email,
  profileBio,
  avatarUrl,
  workspaces,
}: DashboardClientProps) {
  const router = useRouter();
  const [workspaceList, setWorkspaceList] = useState(workspaces);
  const [profileBioDraft, setProfileBioDraft] = useState(profileBio ?? "");
  const [avatarUrlDraft, setAvatarUrlDraft] = useState(avatarUrl ?? "");
  const [createName, setCreateName] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [busy, setBusy] = useState<"create" | "join" | "profile" | null>(null);
  const [openingWorkspaceId, setOpeningWorkspaceId] = useState<number | null>(null);
  const [editingContextWorkspaceId, setEditingContextWorkspaceId] = useState<number | null>(null);
  const [deletingWorkspaceId, setDeletingWorkspaceId] = useState<number | null>(null);
  const [editingWorkspaceImageId, setEditingWorkspaceImageId] = useState<number | null>(null);
  const [openSettingsWorkspaceId, setOpenSettingsWorkspaceId] = useState<number | null>(null);
  const [copiedInviteWorkspaceId, setCopiedInviteWorkspaceId] = useState<number | null>(null);
  const copyResetTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const profileFileInputRef = useRef<HTMLInputElement | null>(null);
  const workspaceFileInputRef = useRef<HTMLInputElement | null>(null);
  const [message, setMessage] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [workspaceImageTargetId, setWorkspaceImageTargetId] = useState<number | null>(null);

  useEffect(() => {
    if (openSettingsWorkspaceId === null) return;
    const onPointerDown = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      if (!target) return;
      if (target.closest('[data-settings-root="true"]')) return;
      setOpenSettingsWorkspaceId(null);
    };
    document.addEventListener("mousedown", onPointerDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
    };
  }, [openSettingsWorkspaceId]);

  async function fileToDataUrl(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === "string") {
          resolve(reader.result);
          return;
        }
        reject(new Error("Could not read file."));
      };
      reader.onerror = () => reject(new Error("Could not read file."));
      reader.readAsDataURL(file);
    });
  }

  async function toImageDataUrl(file: File): Promise<string> {
    if (!file.type.startsWith("image/")) {
      throw new Error("Only image files are allowed.");
    }
    if (file.size > 1_000_000) {
      throw new Error("Image must be smaller than 1 MB.");
    }
    return fileToDataUrl(file);
  }

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
    if (workspaceNameTakenLocally(trimmed, workspaceList)) {
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

  async function openWorkspaceContext(workspaceId: number) {
    setMessage(null);
    setEditingContextWorkspaceId(workspaceId);
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
          text: data?.message ?? "Could not open the workspace context editor.",
        });
        return;
      }
      router.push("/dashboard/workspace");
      router.refresh();
    } catch {
      setMessage({ type: "err", text: "Network error." });
    } finally {
      setEditingContextWorkspaceId(null);
    }
  }

  async function deleteWorkspace(workspaceId: number, workspaceName: string) {
    const confirmed = window.confirm(
      `Delete workspace "${workspaceName}"? This action cannot be undone.`
    );
    if (!confirmed) return;
    setMessage(null);
    setDeletingWorkspaceId(workspaceId);
    try {
      const res = await fetch(`/api/workspaces/${workspaceId}`, {
        method: "DELETE",
      });
      const raw = (await readJsonUnknownFromResponse(res)) as {
        success?: boolean;
        message?: string;
      };
      if (!raw.success) {
        setMessage({
          type: "err",
          text: raw.message ?? "Could not delete the workspace.",
        });
        return;
      }
      setWorkspaceList((prev) => prev.filter((w) => w.id !== workspaceId));
      setMessage({ type: "ok", text: `Workspace "${workspaceName}" deleted.` });
      router.refresh();
    } catch {
      setMessage({ type: "err", text: "Network error." });
    } finally {
      setDeletingWorkspaceId(null);
    }
  }

  async function saveProfile(event: FormEvent) {
    event.preventDefault();
    setMessage(null);
    setBusy("profile");
    try {
      const res = await fetch("/api/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          profileBio: profileBioDraft,
          avatarUrl: avatarUrlDraft,
        }),
      });
      const raw = (await readJsonUnknownFromResponse(res)) as {
        success?: boolean;
        message?: string;
        user?: { profileBio?: string | null; avatarUrl?: string | null };
      };
      if (!raw.success) {
        setMessage({ type: "err", text: raw.message ?? "Could not save profile." });
        return;
      }
      setProfileBioDraft(raw.user?.profileBio ?? "");
      setAvatarUrlDraft(raw.user?.avatarUrl ?? "");
      setMessage({ type: "ok", text: "Profile updated." });
    } catch {
      setMessage({ type: "err", text: "Network error." });
    } finally {
      setBusy(null);
    }
  }

  async function onProfileFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const dataUrl = await toImageDataUrl(file);
      setAvatarUrlDraft(dataUrl);
      setMessage({ type: "ok", text: "Profile image selected. Click Save profile." });
    } catch (error) {
      setMessage({
        type: "err",
        text: error instanceof Error ? error.message : "Could not load image file.",
      });
    } finally {
      event.target.value = "";
    }
  }

  async function onWorkspaceFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    const targetId = workspaceImageTargetId;
    if (!file || targetId === null) return;
    setEditingWorkspaceImageId(targetId);
    setMessage(null);
    try {
      const dataUrl = await toImageDataUrl(file);
      const res = await fetch(`/api/workspaces/${targetId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageUrl: dataUrl }),
      });
      const raw = (await readJsonUnknownFromResponse(res)) as {
        success?: boolean;
        message?: string;
        workspace?: { imageUrl?: string | null; name?: string };
      };
      if (!raw.success) {
        setMessage({ type: "err", text: raw.message ?? "Could not update workspace image." });
        return;
      }
      setWorkspaceList((prev) =>
        prev.map((w) => (w.id === targetId ? { ...w, imageUrl: raw.workspace?.imageUrl ?? null } : w))
      );
      setMessage({ type: "ok", text: "Workspace image updated." });
    } catch (error) {
      setMessage({
        type: "err",
        text: error instanceof Error ? error.message : "Network error.",
      });
    } finally {
      setEditingWorkspaceImageId(null);
      setWorkspaceImageTargetId(null);
      event.target.value = "";
    }
  }

  const ownerCount = workspaceList.filter((workspace) => workspace.role === "OWNER").length;
  const memberCount = workspaceList.length - ownerCount;

  return (
    <div className="min-h-[calc(100vh-4rem)] p-6">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="mx-auto max-w-6xl"
      >
        <section className="relative overflow-hidden rounded-[1.8rem] border border-white/12 bg-zinc-900/50 p-8 shadow-[0_30px_70px_rgba(0,0,0,0.35)]">

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
              <p className="mt-1 text-2xl font-semibold text-white">{workspaceList.length}</p>
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

        <section className="mt-6">
          <MouseTiltCard className="landing-glass rounded-2xl p-6">
            <div className="mb-4 flex items-center gap-3">
              {avatarUrlDraft ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={avatarUrlDraft}
                  alt="Profile avatar"
                  className="h-12 w-12 rounded-full border border-white/20 object-cover"
                />
              ) : (
                <div className="flex h-12 w-12 items-center justify-center rounded-full border border-white/20 bg-white/10 text-sm font-semibold text-white">
                  {email.trim().charAt(0).toUpperCase()}
                </div>
              )}
              <div>
                <p className="text-sm font-semibold text-white">My public profile</p>
                <p className="text-xs text-zinc-400">
                  Visible to everyone in your company workspaces.
                </p>
              </div>
            </div>
            <form onSubmit={saveProfile} className="space-y-3">
              <input
                ref={profileFileInputRef}
                type="file"
                accept="image/*"
                onChange={onProfileFileChange}
                className="hidden"
              />
              <Input
                value={avatarUrlDraft}
                onChange={(e) => setAvatarUrlDraft(e.target.value)}
                placeholder="Avatar URL (https://...)"
                className="h-11 rounded-xl border-white/15 bg-white/5 text-white placeholder:text-zinc-500"
              />
              <textarea
                value={profileBioDraft}
                onChange={(e) => setProfileBioDraft(e.target.value)}
                rows={3}
                placeholder="Short profile bio"
                className="w-full resize-y rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-zinc-500"
              />
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => profileFileInputRef.current?.click()}
                  className="h-10 rounded-xl border-white/20 bg-white/10 px-4 text-white hover:bg-white/20"
                >
                  Upload profile photo
                </Button>
                <Button
                  type="submit"
                  disabled={busy === "profile"}
                  className="h-10 rounded-xl border border-white/25 bg-white px-4 text-black hover:bg-zinc-200"
                >
                  {busy === "profile" ? "Saving..." : "Save profile"}
                </Button>
              </div>
            </form>
          </MouseTiltCard>
        </section>

        {workspaceList.length > 0 ? (
          <motion.section
            className="mt-10"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.15, duration: 0.35 }}
          >
            <h2 className="text-lg font-semibold text-white">Your workspaces</h2>
            <input
              ref={workspaceFileInputRef}
              type="file"
              accept="image/*"
              onChange={onWorkspaceFileChange}
              className="hidden"
            />
            <ul className="mt-3 space-y-3">
              {workspaceList.map((w, i) => {
                const inviteCode = w.inviteCode;
                return (
                  <motion.li
                    key={w.id}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.08 + i * 0.04, duration: 0.3 }}
                    className="relative list-none"
                  >
                    <div className="landing-glass flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 px-4 py-4">
                      <div className="min-w-0 flex flex-1 items-center gap-3">
                        {w.imageUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={w.imageUrl}
                            alt={`${w.name} workspace`}
                            className="h-10 w-10 rounded-lg border border-white/20 object-cover"
                          />
                        ) : (
                          <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-white/20 bg-white/10 text-xs font-semibold text-white">
                            {w.name.trim().charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div className="min-w-0">
                        <p className="font-medium text-white">{w.name}</p>
                        <p className="text-xs text-zinc-400">Role: {w.role}</p>
                        </div>
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
                        <div data-settings-root="true">
                          <Button
                            type="button"
                            variant="outline"
                            className="h-9 w-9 shrink-0 border-white/20 bg-white/10 p-0 text-zinc-100 hover:bg-white/20"
                            onClick={() =>
                              setOpenSettingsWorkspaceId((current) =>
                                current === w.id ? null : w.id
                              )
                            }
                            aria-label="Workspace settings"
                            title="Workspace settings"
                          >
                            <SettingsIcon className="text-base leading-none" />
                          </Button>
                        </div>
                      </div>
                    </div>
                    <AnimatePresence>
                      {openSettingsWorkspaceId === w.id ? (
                        <motion.div
                          data-settings-root="true"
                          initial={{ opacity: 0, y: 8, scale: 0.98 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 8, scale: 0.98 }}
                          transition={{ duration: 0.16, ease: "easeOut" }}
                          className="absolute bottom-[calc(100%+0.35rem)] right-2 z-20 w-48 rounded-xl border border-white/15 bg-black/90 p-2 shadow-[0_18px_45px_rgba(0,0,0,0.45)] backdrop-blur-xl"
                        >
                        {(w.role === "OWNER" || w.role === "ADMIN") ? (
                          <>
                            <button
                              type="button"
                              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs text-zinc-200 transition hover:bg-white/10"
                              disabled={editingWorkspaceImageId === w.id}
                              onClick={() => {
                                setWorkspaceImageTargetId(w.id);
                                workspaceFileInputRef.current?.click();
                                setOpenSettingsWorkspaceId(null);
                              }}
                            >
                              <ImageIcon className="opacity-80" />
                              {editingWorkspaceImageId === w.id ? "Saving..." : "Upload photo"}
                            </button>
                            <button
                              type="button"
                              className="mt-1 flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs text-zinc-200 transition hover:bg-white/10"
                              disabled={editingContextWorkspaceId === w.id}
                              onClick={() => {
                                setOpenSettingsWorkspaceId(null);
                                void openWorkspaceContext(w.id);
                              }}
                            >
                              <EditIcon className="opacity-80" />
                              {editingContextWorkspaceId === w.id ? "Opening..." : "Edit context"}
                            </button>
                          </>
                        ) : (
                          <p className="px-2 py-1 text-xs text-zinc-400">No actions available.</p>
                        )}
                        {w.role === "OWNER" ? (
                          <button
                            type="button"
                            className="mt-1 flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs text-rose-200 transition hover:bg-rose-500/20"
                            disabled={deletingWorkspaceId === w.id}
                            onClick={() => {
                              setOpenSettingsWorkspaceId(null);
                              void deleteWorkspace(w.id, w.name);
                            }}
                          >
                            <TrashIcon className="opacity-90" />
                            {deletingWorkspaceId === w.id ? "Deleting..." : "Delete workspace"}
                          </button>
                        ) : null}
                        </motion.div>
                      ) : null}
                    </AnimatePresence>
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
