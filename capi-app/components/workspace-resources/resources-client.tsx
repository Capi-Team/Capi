"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MouseTiltCard } from "@/components/ui/mouse-tilt-card";
import { readJsonUnknownFromResponse } from "@/lib/http/json";

type ResourceType = "LINK" | "VIDEO" | "IMAGE" | "DOCUMENT" | "OTHER";

type ResourceRow = {
  id: number;
  title: string;
  url: string;
  type: ResourceType;
  isPinned: boolean;
  description: string | null;
  createdAt: string;
  createdBy: {
    id: number;
    email: string;
    avatarUrl: string | null;
  };
};

function iconForType(type: ResourceType): string {
  if (type === "VIDEO") return "🎬";
  if (type === "IMAGE") return "🖼️";
  if (type === "DOCUMENT") return "📄";
  if (type === "OTHER") return "📦";
  return "🔗";
}

export default function ResourcesClient() {
  const [resources, setResources] = useState<ResourceRow[]>([]);
  const [canEdit, setCanEdit] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [type, setType] = useState<ResourceType>("LINK");
  const [description, setDescription] = useState("");
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<"ALL" | ResourceType>("ALL");

  async function loadResources() {
    setLoading(true);
    setMsg(null);
    try {
      const res = await fetch("/api/workspace/resources");
      const raw = (await readJsonUnknownFromResponse(res)) as {
        success?: boolean;
        canEdit?: boolean;
        resources?: ResourceRow[];
        message?: string;
      };
      if (!raw.success || !Array.isArray(raw.resources)) {
        setMsg(raw.message ?? "Could not load resources.");
        return;
      }
      setCanEdit(Boolean(raw.canEdit));
      setResources(raw.resources);
    } catch {
      setMsg("Network error.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadResources();
  }, []);

  const sorted = useMemo(() => {
    const q = query.trim().toLowerCase();
    return [...resources]
      .filter((r) => (typeFilter === "ALL" ? true : r.type === typeFilter))
      .filter((r) => {
        if (!q) return true;
        return (
          r.title.toLowerCase().includes(q) ||
          (r.description?.toLowerCase().includes(q) ?? false) ||
          r.createdBy.email.toLowerCase().includes(q)
        );
      })
      .sort((a, b) => {
        if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
        return +new Date(b.createdAt) - +new Date(a.createdAt);
      });
  }, [resources, query, typeFilter]);

  function getEmbedVideoUrl(url: string): string | null {
    try {
      const u = new URL(url);
      if (u.hostname.includes("youtube.com")) {
        const id = u.searchParams.get("v");
        if (id) return `https://www.youtube.com/embed/${id}`;
      }
      if (u.hostname.includes("youtu.be")) {
        const id = u.pathname.replace("/", "");
        if (id) return `https://www.youtube.com/embed/${id}`;
      }
      return null;
    } catch {
      return null;
    }
  }

  async function onCreate(event: React.FormEvent) {
    event.preventDefault();
    if (!canEdit || busy) return;
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch("/api/workspace/resources", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          url,
          type,
          description,
        }),
      });
      const raw = (await readJsonUnknownFromResponse(res)) as {
        success?: boolean;
        message?: string;
      };
      if (!raw.success) {
        setMsg(raw.message ?? "Could not create resource.");
        return;
      }
      setTitle("");
      setUrl("");
      setType("LINK");
      setDescription("");
      await loadResources();
      setMsg("Resource published.");
    } catch {
      setMsg("Network error.");
    } finally {
      setBusy(false);
    }
  }

  async function onDelete(id: number) {
    if (!canEdit) return;
    const yes = window.confirm("Delete this resource?");
    if (!yes) return;
    setMsg(null);
    try {
      const res = await fetch(`/api/workspace/resources/${id}`, {
        method: "DELETE",
      });
      const raw = (await readJsonUnknownFromResponse(res)) as {
        success?: boolean;
        message?: string;
      };
      if (!raw.success) {
        setMsg(raw.message ?? "Could not delete resource.");
        return;
      }
      setResources((prev) => prev.filter((r) => r.id !== id));
      setMsg("Resource deleted.");
    } catch {
      setMsg("Network error.");
    }
  }

  async function onTogglePin(resource: ResourceRow) {
    if (!canEdit) return;
    setMsg(null);
    try {
      const res = await fetch(`/api/workspace/resources/${resource.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isPinned: !resource.isPinned }),
      });
      const raw = (await readJsonUnknownFromResponse(res)) as {
        success?: boolean;
        message?: string;
      };
      if (!raw.success) {
        setMsg(raw.message ?? "Could not update pin.");
        return;
      }
      setResources((prev) =>
        prev.map((r) => (r.id === resource.id ? { ...r, isPinned: !r.isPinned } : r))
      );
      setMsg(!resource.isPinned ? "Resource pinned." : "Resource unpinned.");
    } catch {
      setMsg("Network error.");
    }
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] p-6">
      <div className="mx-auto max-w-7xl">
        <section className="rounded-2xl border border-white/10 bg-black/35 p-6">
          <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Resources hub</p>
          <h1 className="mt-2 text-3xl font-semibold text-white">Workspace resources</h1>
          <p className="mt-2 max-w-3xl text-sm text-zinc-300">
            Share links, videos, images, and documents for your team in one place.
          </p>
        </section>

        {canEdit ? (
          <section className="mt-6 rounded-2xl border border-white/10 bg-black/35 p-6">
            <p className="text-sm font-medium text-white">Publish resource</p>
            <form onSubmit={onCreate} className="mt-3 grid gap-3 sm:grid-cols-2">
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Title"
                className="h-11 rounded-xl border-white/15 bg-white/5 text-white placeholder:text-zinc-500"
              />
              <Input
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://..."
                className="h-11 rounded-xl border-white/15 bg-white/5 text-white placeholder:text-zinc-500"
              />
              <select
                value={type}
                onChange={(e) => setType(e.target.value as ResourceType)}
                className="select-dark h-11 rounded-xl px-3 text-sm"
              >
                <option value="LINK">Link</option>
                <option value="VIDEO">Video</option>
                <option value="IMAGE">Image</option>
                <option value="DOCUMENT">Document</option>
                <option value="OTHER">Other</option>
              </select>
              <Input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Short description (optional)"
                className="h-11 rounded-xl border-white/15 bg-white/5 text-white placeholder:text-zinc-500"
              />
              <div className="sm:col-span-2">
                <Button
                  type="submit"
                  disabled={busy || !title.trim() || !url.trim()}
                  className="h-10 rounded-xl border border-white/25 bg-white px-4 text-black hover:bg-zinc-200"
                >
                  {busy ? "Publishing..." : "Publish resource"}
                </Button>
              </div>
            </form>
          </section>
        ) : null}

        {msg ? <p className="mt-4 text-sm text-zinc-300">{msg}</p> : null}

        <section className="mt-6">
          <div className="mb-4 grid gap-3 sm:grid-cols-[1fr_200px]">
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by title, description, or author"
              className="h-10 rounded-xl border-white/15 bg-white/5 text-white placeholder:text-zinc-500"
            />
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as "ALL" | ResourceType)}
              className="select-dark h-10 rounded-xl px-3 text-sm"
            >
              <option value="ALL">All types</option>
              <option value="LINK">Link</option>
              <option value="VIDEO">Video</option>
              <option value="IMAGE">Image</option>
              <option value="DOCUMENT">Document</option>
              <option value="OTHER">Other</option>
            </select>
          </div>
          {loading ? (
            <p className="text-sm text-zinc-400">Loading resources...</p>
          ) : sorted.length === 0 ? (
            <p className="text-sm text-zinc-400">No resources yet.</p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {sorted.map((resource) => (
                <MouseTiltCard
                  key={resource.id}
                  className="landing-glass rounded-2xl border border-white/10 p-5"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-2xl">
                        {iconForType(resource.type)} {resource.isPinned ? "📌" : ""}
                      </p>
                      <p className="mt-2 line-clamp-2 text-base font-semibold text-white">
                        {resource.title}
                      </p>
                    </div>
                    {canEdit ? (
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => void onTogglePin(resource)}
                          className="rounded-lg border border-white/20 bg-white/10 px-2 py-1 text-xs text-zinc-100 transition hover:bg-white/20"
                        >
                          {resource.isPinned ? "Unpin" : "Pin"}
                        </button>
                        <button
                          type="button"
                          onClick={() => void onDelete(resource.id)}
                          className="rounded-lg border border-rose-400/30 bg-rose-500/10 px-2 py-1 text-xs text-rose-100 transition hover:bg-rose-500/20"
                        >
                          Delete
                        </button>
                      </div>
                    ) : null}
                  </div>

                  {resource.type === "IMAGE" ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={resource.url}
                      alt={resource.title}
                      className="mt-3 h-40 w-full rounded-xl border border-white/10 object-cover"
                    />
                  ) : null}
                  {resource.type === "VIDEO" && getEmbedVideoUrl(resource.url) ? (
                    <iframe
                      src={getEmbedVideoUrl(resource.url) ?? undefined}
                      title={resource.title}
                      className="mt-3 h-40 w-full rounded-xl border border-white/10"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                      referrerPolicy="strict-origin-when-cross-origin"
                      allowFullScreen
                    />
                  ) : null}

                  {resource.description ? (
                    <p className="mt-2 line-clamp-3 text-sm text-zinc-300">{resource.description}</p>
                  ) : null}

                  <a
                    href={resource.url}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-4 inline-block text-sm text-emerald-300 transition hover:text-emerald-200"
                  >
                    Open resource
                  </a>

                  <p className="mt-3 text-xs text-zinc-500">
                    Shared by {resource.createdBy.email}
                  </p>
                </MouseTiltCard>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
