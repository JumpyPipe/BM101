"use client";

import { useRef, useState, useTransition, type FormEvent } from "react";
import { Send, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type Message = { role: "USER" | "ASSISTANT"; content: string };

export function AssistantChat({
  babyId,
  initialMessages,
}: {
  babyId: string;
  initialMessages: Message[];
}) {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [input, setInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const bottomRef = useRef<HTMLDivElement>(null);

  function scrollToBottom() {
    requestAnimationFrame(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }));
  }

  async function sendMessage(e: FormEvent) {
    e.preventDefault();
    const text = input.trim();
    if (!text || isPending) return;

    setInput("");
    setError(null);
    setMessages((prev) => [...prev, { role: "USER", content: text }, { role: "ASSISTANT", content: "" }]);
    scrollToBottom();

    startTransition(async () => {
      try {
        const res = await fetch("/api/assistant", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ babyId, message: text }),
        });

        if (!res.ok || !res.body) {
          const text = await res.text().catch(() => "");
          throw new Error(text || `Request failed (${res.status})`);
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder();

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value, { stream: true });
          setMessages((prev) => {
            const next = [...prev];
            next[next.length - 1] = {
              role: "ASSISTANT",
              content: next[next.length - 1].content + chunk,
            };
            return next;
          });
          scrollToBottom();
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : "Something went wrong");
        setMessages((prev) => prev.slice(0, -1));
      }
    });
  }

  return (
    <div className="flex h-[70vh] flex-col rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex-1 overflow-y-auto p-4">
        {messages.length === 0 && (
          <div className="flex h-full flex-col items-center justify-center gap-2 text-center text-sm text-zinc-400">
            <Sparkles className="h-6 w-6 text-violet-500" />
            Ask about feeding schedules, sleep patterns, milestones, or anything else — the
            assistant can see this baby&apos;s recent logs.
          </div>
        )}
        <div className="flex flex-col gap-4">
          {messages.map((m, i) => (
            <div
              key={i}
              className={cn("flex", m.role === "USER" ? "justify-end" : "justify-start")}
            >
              <div
                className={cn(
                  "max-w-[85%] whitespace-pre-wrap rounded-2xl px-4 py-2 text-sm",
                  m.role === "USER"
                    ? "bg-teal-600 text-white"
                    : "bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100",
                )}
              >
                {m.content || (isPending && i === messages.length - 1 ? "…" : "")}
              </div>
            </div>
          ))}
        </div>
        <div ref={bottomRef} />
      </div>

      {error && (
        <p className="border-t border-zinc-100 px-4 py-2 text-sm text-red-600 dark:border-zinc-800">
          {error}
        </p>
      )}

      <form onSubmit={sendMessage} className="flex gap-2 border-t border-zinc-100 p-3 dark:border-zinc-800">
        <Textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              sendMessage(e);
            }
          }}
          placeholder="Ask a question about your baby..."
          rows={1}
          className="resize-none"
        />
        <Button type="submit" disabled={isPending || !input.trim()}>
          <Send className="h-4 w-4" />
        </Button>
      </form>
    </div>
  );
}
