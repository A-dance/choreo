"use client";

import { useEffect, useRef, useState } from "react";
import { useProfile } from "@/context/ProfileContext";
import { getStrings } from "@/lib/uiStrings";

interface HelpPanelProps {
  open: boolean;
  onClose: () => void;
}

export interface HelpMessage {
  id: string;
  role: "user" | "assistant";
  text: string;
}

const SUGGESTIONS_JA = [
  "名前を変更したい",
  "フォルダーでプロジェクトを整理したい",
  "メガファイル便のURLは音源に使える？",
  "間違えた、戻したい",
];

const SUGGESTIONS_EN = [
  "I want to change a name",
  "How do I organize projects in folders?",
  "Can I use a file-sharing URL for music?",
  "I made a mistake, how do I undo?",
];

function newMessageId(): string {
  return `msg-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function formatHelpApiError(
  error: string | undefined,
  UI: ReturnType<typeof getStrings>,
): string {
  if (!error) return UI.helpError;
  if (error === "not_configured") return UI.helpNotConfigured;
  const lower = error.toLowerCase();
  if (
    lower.includes("quota") ||
    lower.includes("rate limit") ||
    lower.includes("resource_exhausted")
  ) {
    return UI.helpQuotaExceeded;
  }
  return UI.helpError;
}

export function HelpPanel({ open, onClose }: HelpPanelProps) {
  const { language } = useProfile();
  const UI = getStrings(language);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [messages, setMessages] = useState<HelpMessage[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const suggestions = language === "ja" ? SUGGESTIONS_JA : SUGGESTIONS_EN;

  useEffect(() => {
    if (open) {
      window.setTimeout(() => inputRef.current?.focus(), 120);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, busy]);

  function clearChat() {
    setMessages([]);
    setError(null);
    setInput("");
  }

  async function sendMessage(question: string) {
    const trimmed = question.trim();
    if (!trimmed || busy) return;

    const userMsg: HelpMessage = {
      id: newMessageId(),
      role: "user",
      text: trimmed,
    };
    const nextMessages = [...messages, userMsg];

    setError(null);
    setBusy(true);
    setMessages(nextMessages);
    setInput("");

    try {
      const res = await fetch("/api/help", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          language,
          messages: nextMessages.map((m) => ({ role: m.role, text: m.text })),
        }),
      });
      const data = (await res.json()) as { answer?: string; error?: string };
      if (!res.ok) {
        setError(formatHelpApiError(data.error, UI));
        return;
      }
      setMessages((prev) => [
        ...prev,
        {
          id: newMessageId(),
          role: "assistant",
          text: data.answer ?? "",
        },
      ]);
    } catch {
      setError(UI.helpError);
    } finally {
      setBusy(false);
      inputRef.current?.focus();
    }
  }

  function handleComposerKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key !== "Enter" || e.shiftKey || e.nativeEvent.isComposing) return;
    e.preventDefault();
    void sendMessage(input);
  }

  if (!open) return null;

  return (
    <aside
      className="help-panel"
      role="dialog"
      aria-modal="false"
      aria-labelledby="help-panel-title"
    >
      <header className="help-chat-head">
        <div className="help-chat-head-main">
          <h2 id="help-panel-title" className="help-chat-title">
            {UI.helpTitle}
          </h2>
          {busy ? <p className="help-chat-status">{UI.helpThinking}</p> : null}
        </div>
        <div className="help-chat-head-actions">
          {messages.length > 0 ? (
            <button
              type="button"
              className="help-chat-head-btn"
              onClick={clearChat}
              disabled={busy}
            >
              {UI.helpNewChat}
            </button>
          ) : null}
          <button
            type="button"
            className="help-chat-head-btn close"
            onClick={onClose}
            aria-label={UI.close}
          >
            ×
          </button>
        </div>
      </header>

      <div className="help-chat-thread" ref={scrollRef}>
        {messages.map((msg) => (
          <div key={msg.id} className={`help-chat-row ${msg.role}`}>
            <span className="help-chat-label">
              {msg.role === "user" ? UI.helpYouLabel : UI.helpBotLabel}
            </span>
            <div className={`help-chat-bubble ${msg.role}`}>{msg.text}</div>
          </div>
        ))}

        {busy ? (
          <div className="help-chat-row assistant">
            <span className="help-chat-label">{UI.helpBotLabel}</span>
            <div className="help-chat-bubble assistant typing" aria-live="polite">
              <span className="help-typing-dots" aria-hidden>
                <span />
                <span />
                <span />
              </span>
            </div>
          </div>
        ) : null}

        {messages.length === 0 && !busy ? (
          <div className="help-chat-suggestions">
            <p className="help-chat-suggestions-label">{UI.helpSuggestionsLabel}</p>
            <div className="help-chat-suggestion-list">
              {suggestions.map((s) => (
                <button
                  key={s}
                  type="button"
                  className="help-chat-suggestion"
                  onClick={() => void sendMessage(s)}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : null}
      </div>

      {error ? (
        <p className="help-chat-error" role="alert">
          {error}
        </p>
      ) : null}

      <footer className="help-chat-composer">
        <div className="help-chat-composer-inner">
          <textarea
            ref={inputRef}
            className="help-chat-input"
            rows={1}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleComposerKeyDown}
            placeholder={UI.helpPlaceholder}
            disabled={busy}
            maxLength={500}
            aria-label={UI.helpPlaceholder}
          />
          <button
            type="button"
            className="help-chat-send"
            disabled={busy || !input.trim()}
            onClick={() => void sendMessage(input)}
            aria-label={UI.helpSend}
          >
            ↑
          </button>
        </div>
        <p className="help-chat-composer-hint">{UI.helpComposerHint}</p>
      </footer>
    </aside>
  );
}
