"use client";

import type { ChatMessageRole } from "@prisma/client";
import { AnimatePresence, motion } from "framer-motion";
import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MouseTiltCard } from "@/components/ui/mouse-tilt-card";
import { readJsonUnknownFromResponse } from "@/lib/http/json";

type MemberConfig = {
  companyName: string;
  welcomeMessage: string | null;
  userInstructions: string | null;
  strictMode: boolean;
};

type FullConfig = MemberConfig & {
  id: number;
  workspaceId: number;
  aiContext: string;
  updatedAt: string;
};

type ConfigResponse =
  | { success: true; canEdit: false; config: MemberConfig }
  | { success: true; canEdit: true; config: FullConfig };

type ChatMessage = {
  id: number;
  role: ChatMessageRole;
  content: string;
  createdAt: string;
};

type ConversationRow = {
  id: number;
  title: string | null;
  createdAt: string;
  updatedAt: string;
};

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

function isConfigResponse(raw: unknown): raw is ConfigResponse {
  if (!raw || typeof raw !== "object") return false;
  const r = raw as Record<string, unknown>;
  return r.success === true && typeof r.canEdit === "boolean" && r.config !== undefined;
}

export default function WorkspaceAiClient() {
  const bottomRef = useRef<HTMLDivElement>(null);

  const [configLoading, setConfigLoading] = useState(true);
  const [configError, setConfigError] = useState<string | null>(null);
  const [canEdit, setCanEdit] = useState(false);
  const [memberConfig, setMemberConfig] = useState<MemberConfig | null>(null);
  const [editDraft, setEditDraft] = useState<FullConfig | null>(null);
  const [configSavedMsg, setConfigSavedMsg] = useState<string | null>(null);

  const [conversations, setConversations] = useState<ConversationRow[]>([]);
  const [conversationId, setConversationId] = useState<number | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [chatBusy, setChatBusy] = useState(false);
  const [chatError, setChatError] = useState<string | null>(null);
  const [deletingConversationId, setDeletingConversationId] = useState<number | null>(null);
  const [isAdminConfigModalOpen, setIsAdminConfigModalOpen] = useState(false);

  const scrollToBottom = useCallback(() => {
    requestAnimationFrame(() => {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    });
  }, []);

  const loadConfig = useCallback(async () => {
    setConfigLoading(true);
    setConfigError(null);
    try {
      const res = await fetch("/api/workspace/ai/config");
      const raw = await readJsonUnknownFromResponse(res);
      if (!isConfigResponse(raw)) {
        setConfigError("Could not load configuration.");
        return;
      }
      setCanEdit(raw.canEdit);
      const c = raw.config;
      setMemberConfig({
        companyName: c.companyName,
        welcomeMessage: c.welcomeMessage,
        userInstructions: c.userInstructions,
        strictMode: c.strictMode,
      });
      if (raw.canEdit && "aiContext" in c) {
        setEditDraft(c as FullConfig);
      } else {
        setEditDraft(null);
      }
    } catch {
      setConfigError("Network error while loading configuration.");
    } finally {
      setConfigLoading(false);
    }
  }, []);

  const loadConversations = useCallback(async () => {
    try {
      const res = await fetch("/api/workspace/ai/conversations");
      const raw = (await readJsonUnknownFromResponse(res)) as {
        success?: boolean;
        conversations?: ConversationRow[];
      };
      if (raw.success && Array.isArray(raw.conversations)) {
        setConversations(raw.conversations);
      }
    } catch {
      /* ignore list errors */
    }
  }, []);

  useEffect(() => {
    void loadConfig();
    void loadConversations();
  }, [loadConfig, loadConversations]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  async function loadConversation(id: number) {
    setChatError(null);
    try {
      const res = await fetch(`/api/workspace/ai/conversations/${id}`);
      const raw = (await readJsonUnknownFromResponse(res)) as {
        success?: boolean;
        messages?: ChatMessage[];
      };
      if (!raw.success || !Array.isArray(raw.messages)) {
        setChatError("Could not load conversation.");
        return;
      }
      setConversationId(id);
      setMessages(raw.messages);
    } catch {
      setChatError("Network error.");
    }
  }

  function startNewChat() {
    setConversationId(null);
    setMessages([]);
    setChatError(null);
    setInput("");
  }

  async function deleteConversation(id: number) {
    const confirmed = window.confirm("Delete this conversation? This action cannot be undone.");
    if (!confirmed) return;
    setDeletingConversationId(id);
    setChatError(null);
    try {
      const res = await fetch(`/api/workspace/ai/conversations/${id}`, {
        method: "DELETE",
      });
      const raw = (await readJsonUnknownFromResponse(res)) as {
        success?: boolean;
        message?: string;
      };
      if (!raw.success) {
        setChatError(raw.message ?? "Could not delete conversation.");
        return;
      }
      setConversations((prev) => prev.filter((c) => c.id !== id));
      if (conversationId === id) {
        setConversationId(null);
        setMessages([]);
      }
    } catch {
      setChatError("Network error while deleting conversation.");
    } finally {
      setDeletingConversationId(null);
    }
  }

  async function sendMessage(event: React.FormEvent) {
    event.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || chatBusy) return;

    setChatBusy(true);
    setChatError(null);
    setInput("");

    const optimisticUser: ChatMessage = {
      id: -Date.now(),
      role: "USER",
      content: trimmed,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimisticUser]);

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 20000);
      const res = await fetch("/api/workspace/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          message: trimmed,
          conversationId: conversationId ?? undefined,
        }),
      }).finally(() => clearTimeout(timeout));
      const raw = (await readJsonUnknownFromResponse(res)) as {
        success?: boolean;
        messages?: ChatMessage[];
        conversationId?: number;
        message?: string;
        detail?: string;
      };

      if (!raw.success || !raw.messages) {
        setMessages((prev) => prev.filter((m) => m.id !== optimisticUser.id));
        const detail = typeof raw.detail === "string" ? raw.detail.trim() : "";
        setChatError(
          detail ? `${raw.message ?? "Could not send message."} (${detail})` : (raw.message ?? "Could not send message.")
        );
        return;
      }

      if (typeof raw.conversationId === "number") {
        setConversationId(raw.conversationId);
      }
      setMessages(raw.messages);
      void loadConversations();
    } catch (error) {
      setMessages((prev) => prev.filter((m) => m.id !== optimisticUser.id));
      if (error instanceof Error && error.name === "AbortError") {
        setChatError("Request timed out. Please try again.");
      } else {
        setChatError("Network error.");
      }
    } finally {
      setChatBusy(false);
    }
  }

  async function saveConfig(event: React.FormEvent) {
    event.preventDefault();
    if (!editDraft) return;
    setConfigSavedMsg(null);
    try {
      const res = await fetch("/api/workspace/ai/config", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyName: editDraft.companyName,
          aiContext: editDraft.aiContext,
          welcomeMessage: editDraft.welcomeMessage,
          userInstructions: editDraft.userInstructions,
          strictMode: editDraft.strictMode,
        }),
      });
      const raw = (await readJsonUnknownFromResponse(res)) as {
        success?: boolean;
        message?: string;
        config?: FullConfig;
      };
      if (!raw.success || !raw.config) {
        setConfigSavedMsg(raw.message ?? "Could not save.");
        return;
      }
      setEditDraft(raw.config);
      setMemberConfig({
        companyName: raw.config.companyName,
        welcomeMessage: raw.config.welcomeMessage,
        userInstructions: raw.config.userInstructions,
        strictMode: raw.config.strictMode,
      });
      setConfigSavedMsg("Changes saved.");
    } catch {
      setConfigSavedMsg("Network error.");
    }
  }

  const welcome =
    memberConfig?.welcomeMessage?.trim() ||
    `Welcome to the training assistant for ${memberConfig?.companyName ?? "your company"}.`;

  return (
    <div className="min-h-[calc(100vh-4rem)] p-6">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="mx-auto max-w-7xl"
      >
        <section className="relative overflow-hidden rounded-[1.8rem] border border-white/12 bg-zinc-900/50 p-8 shadow-[0_28px_70px_rgba(0,0,0,0.38)]">

          <motion.p
            initial={{ opacity: 0, x: -6 }}
            animate={{ opacity: 1, x: 0 }}
            className="relative text-xs uppercase tracking-[0.28em] text-zinc-400"
          >
            Contextual assistant
          </motion.p>
          <h1 className="relative mt-3 text-3xl font-semibold leading-tight text-white sm:text-4xl">
            Isolated AI
            <br />
            <span className="text-zinc-300">per workspace.</span>
          </h1>
          <p className="relative mt-4 max-w-2xl text-sm text-zinc-300 sm:text-base">
            {welcome}
          </p>
        </section>

        {configLoading ? (
          <p className="mt-6 text-sm text-zinc-400">Loading workspace context...</p>
        ) : null}
        {configError ? (
          <p className="mt-6 text-sm text-rose-300">{configError}</p>
        ) : null}

        <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,280px)_1fr]">
          <motion.aside
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.05, duration: 0.35 }}
            className="space-y-4"
          >
            <MouseTiltCard className="landing-glass rounded-2xl p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-zinc-400">Conversations</p>
              <Button
                type="button"
                variant="outline"
                className="mt-3 h-9 w-full border-white/20 bg-white/10 text-xs text-white hover:bg-white/20"
                onClick={startNewChat}
              >
                New conversation
              </Button>
              <ul className="mt-3 max-h-64 space-y-2 overflow-y-auto pr-1">
                {conversations.map((c, i) => (
                  <motion.li
                    key={c.id}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.03 }}
                  >
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => void loadConversation(c.id)}
                        className={`flex-1 rounded-xl border px-3 py-2 text-left text-xs transition-colors ${conversationId === c.id
                            ? "border-white/35 bg-white/15 text-white"
                            : "border-white/10 bg-black/30 text-zinc-300 hover:border-white/25 hover:bg-white/10"
                          }`}
                      >
                        <span className="line-clamp-2">{c.title || `Chat #${c.id}`}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => void deleteConversation(c.id)}
                        disabled={deletingConversationId === c.id}
                        className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-rose-400/30 bg-rose-500/10 text-rose-100 transition hover:bg-rose-500/20 disabled:opacity-60"
                        aria-label="Delete conversation"
                      >
                        {deletingConversationId === c.id ? (
                          <span className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-rose-200/60 border-t-white" />
                        ) : (
                          <TrashIcon />
                        )}
                      </button>
                    </div>
                  </motion.li>
                ))}
              </ul>
            </MouseTiltCard>

            {canEdit && editDraft ? (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <MouseTiltCard className="landing-glass rounded-2xl p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-zinc-400">Admin panel</p>
                  <p className="mt-2 text-xs text-zinc-400">
                    Open a modal to edit company settings and AI context.
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsAdminConfigModalOpen(true)}
                    className="mt-3 h-9 w-full rounded-xl border-white/20 bg-white/10 px-3 text-xs text-white hover:bg-white/20"
                  >
                    Open admin configuration
                  </Button>
                  {configSavedMsg ? <p className="mt-2 text-xs text-emerald-300">{configSavedMsg}</p> : null}
                </MouseTiltCard>
              </motion.div>
            ) : null}
          </motion.aside>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08, duration: 0.4 }}
            className="space-y-4"
          >
            <MouseTiltCard className="landing-glass flex min-h-[520px] flex-col rounded-2xl border border-white/12 p-0">
              <div className="border-b border-white/10 px-5 py-4">
                <p className="text-sm font-medium text-white">
                  Chat — {memberConfig?.companyName ?? "…"}
                </p>
                <p className="text-xs text-zinc-500">
                  History is private and only uses this workspace context.
                </p>
              </div>

              <div className="flex-1 space-y-3 overflow-y-auto px-5 py-4">
                <AnimatePresence initial={false}>
                  {messages.length === 0 ? (
                    <motion.p
                      key="empty"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-sm text-zinc-400"
                    >
                      Ask about internal processes, policies, or training.
                    </motion.p>
                  ) : (
                    messages.map((m) => (
                      <motion.div
                        key={m.id}
                        layout
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -4 }}
                        transition={{ duration: 0.22 }}
                        className={`max-w-[92%] rounded-2xl border px-4 py-3 text-sm leading-relaxed ${m.role === "USER"
                            ? "ml-auto border-emerald-500/25 bg-emerald-500/10 text-emerald-50"
                            : "border-white/10 bg-black/35 text-zinc-100"
                          }`}
                      >
                        <p className="text-[10px] uppercase tracking-wider text-zinc-500">
                          {m.role === "USER" ? "You" : "Assistant"}
                        </p>
                        <p className="mt-1 whitespace-pre-wrap">{m.content}</p>
                      </motion.div>
                    ))
                  )}
                  {chatBusy ? (
                    <motion.div
                      key="thinking"
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -4 }}
                      transition={{ duration: 0.2 }}
                      className="max-w-[92%] rounded-2xl border border-white/10 bg-black/35 px-4 py-3 text-sm text-zinc-100"
                    >
                      <p className="text-[10px] uppercase tracking-wider text-zinc-500">Assistant</p>
                      <div className="mt-2 flex items-center gap-2 text-zinc-300">
                        <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-zinc-500 border-t-white" />
                        <span>AI is thinking...</span>
                      </div>
                    </motion.div>
                  ) : null}
                </AnimatePresence>
                <div ref={bottomRef} />
              </div>

              {chatError ? <p className="px-5 pb-2 text-xs text-rose-300">{chatError}</p> : null}

              <form
                onSubmit={sendMessage}
                className="border-t border-white/10 p-4"
              >
                <div className="flex gap-2">
                  <Input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Ask within your company context..."
                    disabled={chatBusy}
                    className="h-11 flex-1 rounded-xl border-white/15 bg-white/5 text-white placeholder:text-zinc-500"
                  />
                  <Button
                    type="submit"
                    disabled={chatBusy || !input.trim()}
                    className="h-11 shrink-0 rounded-xl border border-white/25 bg-white px-5 text-black hover:bg-zinc-200"
                  >
                    {chatBusy ? "..." : "Send"}
                  </Button>
                </div>
              </form>
            </MouseTiltCard>

            {memberConfig?.userInstructions ? (
              <MouseTiltCard className="landing-glass rounded-2xl border border-white/12 p-5 text-sm text-zinc-200">
                <p className="text-xs uppercase tracking-[0.2em] text-zinc-400">
                  Workspace instructions
                </p>
                <div className="mt-3 max-h-72 overflow-y-auto rounded-xl border border-white/10 bg-black/25 p-4">
                  <p className="whitespace-pre-wrap break-words leading-relaxed text-zinc-200">
                    {memberConfig.userInstructions}
                  </p>
                </div>
              </MouseTiltCard>
            ) : null}
          </motion.div>
        </div>

        <AnimatePresence>
          {canEdit && editDraft && isAdminConfigModalOpen ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
              onClick={() => setIsAdminConfigModalOpen(false)}
            >
              <motion.div
                initial={{ opacity: 0, y: 12, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.98 }}
                transition={{ duration: 0.18 }}
                className="w-full max-w-4xl rounded-2xl border border-white/15 bg-[#090909] p-5 shadow-[0_24px_70px_rgba(0,0,0,0.55)]"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-zinc-400">Admin configuration</p>
                    <p className="mt-1 text-sm text-zinc-300">
                      Edit company settings, member-facing instructions, and hidden model context.
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsAdminConfigModalOpen(false)}
                    className="h-9 rounded-xl border-white/20 bg-white/10 px-3 text-xs text-white hover:bg-white/20"
                  >
                    Close
                  </Button>
                </div>

                <form
                  onSubmit={async (e) => {
                    await saveConfig(e);
                    if (!configSavedMsg || configSavedMsg === "Changes saved.") {
                      setIsAdminConfigModalOpen(false);
                    }
                  }}
                  className="mt-4 space-y-3"
                >
                  <label className="block text-xs text-zinc-400">
                    Company name
                    <Input
                      value={editDraft.companyName}
                      onChange={(e) =>
                        setEditDraft((d) => (d ? { ...d, companyName: e.target.value } : d))
                      }
                      className="mt-1 h-10 rounded-xl border-white/15 bg-white/5 text-white"
                    />
                  </label>

                  <label className="block text-xs text-zinc-400">
                    Welcome message
                    <textarea
                      value={editDraft.welcomeMessage ?? ""}
                      onChange={(e) =>
                        setEditDraft((d) =>
                          d ? { ...d, welcomeMessage: e.target.value || null } : d
                        )
                      }
                      rows={3}
                      className="input-scrollbar mt-1 w-full resize-y rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-zinc-500"
                    />
                  </label>

                  <label className="block text-xs text-zinc-400">
                    Team instructions (read-only for members)
                    <textarea
                      value={editDraft.userInstructions ?? ""}
                      onChange={(e) =>
                        setEditDraft((d) =>
                          d ? { ...d, userInstructions: e.target.value || null } : d
                        )
                      }
                      rows={6}
                      className="input-scrollbar mt-1 w-full resize-y rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-zinc-500"
                    />
                  </label>

                  <label className="block text-xs text-zinc-400">
                    Model context (not visible to members)
                    <textarea
                      value={editDraft.aiContext}
                      onChange={(e) => setEditDraft((d) => (d ? { ...d, aiContext: e.target.value } : d))}
                      rows={12}
                      className="input-scrollbar mt-1 w-full resize-y rounded-xl border border-white/15 bg-white/5 px-3 py-2 font-mono text-xs text-zinc-100 placeholder:text-zinc-500"
                    />
                  </label>

                  <label className="flex items-center gap-2 text-xs text-zinc-300">
                    <input
                      type="checkbox"
                      checked={editDraft.strictMode}
                      onChange={(e) =>
                        setEditDraft((d) =>
                          d ? { ...d, strictMode: e.target.checked } : d
                        )
                      }
                      className="rounded border-white/30"
                    />
                    Strict mode (documented context only)
                  </label>

                  <div className="flex items-center justify-end gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsAdminConfigModalOpen(false)}
                      className="h-10 rounded-xl border-white/20 bg-white/10 px-4 text-white hover:bg-white/20"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      className="h-10 rounded-xl border border-white/25 bg-white px-4 text-black hover:bg-zinc-200"
                    >
                      Save configuration
                    </Button>
                  </div>
                </form>
              </motion.div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
