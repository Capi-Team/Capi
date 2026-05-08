import { ollamaConfig } from "@/lib/config";

type ChatMessageRole = "USER" | "ASSISTANT" | "SYSTEM";

export type OllamaChatMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

export type OllamaChatResult =
  | { ok: true; content: string }
  | { ok: false; error: string; status?: number };

type OllamaChatApiResponse = {
  message?: { content?: string };
  error?: string;
};

const OLLAMA_TIMEOUT_MS = 12000;

function mapRole(role: ChatMessageRole): "user" | "assistant" | "system" {
  if (role === "ASSISTANT") return "assistant";
  if (role === "SYSTEM") return "system";
  return "user";
}

export async function completeChat(params: {
  systemPrompt: string;
  history: { role: ChatMessageRole; content: string }[];
  userMessage: string;
}): Promise<OllamaChatResult> {
  const messages: OllamaChatMessage[] = [
    { role: "system", content: params.systemPrompt },
    ...params.history.map((m) => ({
      role: mapRole(m.role),
      content: m.content,
    })),
    { role: "user", content: params.userMessage },
  ];

  const url = `${ollamaConfig.baseUrl}/api/chat`;

  async function callChat(model: string) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), OLLAMA_TIMEOUT_MS);
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: controller.signal,
      body: JSON.stringify({
        model,
        messages,
        stream: false,
        options: {
          temperature: 0.1,
          top_p: 0.8,
          repeat_penalty: 1.2,
        },
      }),
    }).finally(() => clearTimeout(timeout));
    let data: OllamaChatApiResponse | null = null;
    try {
      data = (await res.json()) as OllamaChatApiResponse;
    } catch {
      data = null;
    }
    return { res, data };
  }

  async function pickAvailableModel(): Promise<string | null> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), OLLAMA_TIMEOUT_MS);
    try {
      const res = await fetch(`${ollamaConfig.baseUrl}/api/tags`, {
        signal: controller.signal,
      });
      if (!res.ok) return null;
      const data = (await res.json()) as {
        models?: Array<{ name?: string }>;
      };
      const model = data.models?.find((m) => typeof m.name === "string" && m.name.trim())?.name;
      return model?.trim() || null;
    } catch {
      return null;
    } finally {
      clearTimeout(timeout);
    }
  }

  try {
    let modelToUse = ollamaConfig.model;
    let { res, data } = await callChat(modelToUse);

    const modelMissing =
      res.status === 404 &&
      `${data?.error ?? ""}`.toLowerCase().includes("model") &&
      `${data?.error ?? ""}`.toLowerCase().includes("not found");

    if (modelMissing) {
      const fallback = await pickAvailableModel();
      if (fallback && fallback !== modelToUse) {
        modelToUse = fallback;
        ({ res, data } = await callChat(modelToUse));
      }
    }

    if (!res.ok) {
      const errText = data?.error ?? (await res.text().catch(() => ""));
      return {
        ok: false,
        status: res.status,
        error:
          errText ||
          `Ollama respondió con estado ${res.status}. Verifica OLLAMA_URL y el modelo disponible.`,
      };
    }

    const content = data?.message?.content?.trim();
    if (!content) {
      return { ok: false, error: "Respuesta vacía de Ollama." };
    }
    return { ok: true, content };
  } catch (e) {
    if (e instanceof Error && e.name === "AbortError") {
      return {
        ok: false,
        error: "The model request timed out. Check whether Ollama is running and reachable.",
      };
    }
    const message = e instanceof Error ? e.message : "Error de red con Ollama.";
    return { ok: false, error: message };
  }
}
