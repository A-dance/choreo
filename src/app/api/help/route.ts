import { NextResponse } from "next/server";
import { buildHelpSystemPrompt, formatHelpAnswer } from "@/lib/helpKnowledge";
import { normalizeLanguage } from "@/lib/uiStrings";

interface HelpTurn {
  role: "user" | "assistant";
  text: string;
}

interface GeminiResponse {
  candidates?: Array<{
    content?: { parts?: Array<{ text?: string }> };
  }>;
  error?: { message?: string };
}

const MAX_TURNS = 20;
const MAX_MESSAGE_CHARS = 500;
const MAX_TOTAL_CHARS = 8000;

function parseMessages(raw: unknown): HelpTurn[] {
  if (!Array.isArray(raw)) return [];
  const out: HelpTurn[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const role = (item as HelpTurn).role;
    const text = typeof (item as HelpTurn).text === "string" ? (item as HelpTurn).text.trim() : "";
    if (!text || (role !== "user" && role !== "assistant")) continue;
    out.push({ role, text: text.slice(0, MAX_MESSAGE_CHARS) });
  }
  return out.slice(-MAX_TURNS);
}

function toGeminiContents(messages: HelpTurn[]) {
  return messages.map((msg) => ({
    role: msg.role === "assistant" ? "model" : "user",
    parts: [{ text: msg.text }],
  }));
}

export async function POST(request: Request) {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) {
    return NextResponse.json({ error: "not_configured" }, { status: 503 });
  }

  let body: { messages?: unknown; language?: string };
  try {
    body = (await request.json()) as { messages?: unknown; language?: string };
  } catch {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }

  const messages = parseMessages(body.messages);
  const last = messages[messages.length - 1];
  if (!last || last.role !== "user") {
    return NextResponse.json({ error: "empty_question" }, { status: 400 });
  }

  const totalChars = messages.reduce((n, m) => n + m.text.length, 0);
  if (totalChars > MAX_TOTAL_CHARS) {
    return NextResponse.json({ error: "conversation_too_long" }, { status: 400 });
  }

  const language = normalizeLanguage(body.language);
  const systemPrompt = buildHelpSystemPrompt(language, last.text);
  const model = process.env.GEMINI_MODEL?.trim() || "gemini-2.5-flash";
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  const geminiRes = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: systemPrompt }] },
      contents: toGeminiContents(messages),
      generationConfig: {
        temperature: 0.5,
        maxOutputTokens: 1024,
      },
    }),
  });

  const data = (await geminiRes.json()) as GeminiResponse;
  if (!geminiRes.ok) {
    const message = data.error?.message ?? "gemini_error";
    return NextResponse.json({ error: message }, { status: 502 });
  }

  const answer =
    data.candidates?.[0]?.content?.parts
      ?.map((p) => p.text ?? "")
      .join("")
      .trim() ?? "";

  if (!answer) {
    return NextResponse.json({ error: "empty_response" }, { status: 502 });
  }

  return NextResponse.json({ answer: formatHelpAnswer(answer) });
}
