/**
 * AssistantPanel — main AI chat interface.
 *
 * No extra markdown library needed — renders bold/italic/lists/code
 * with a lightweight inline parser.
 */
import { Bot, Loader2, Send, Sparkles, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { JourneyRecommendations } from "@/components/assistant/JourneyRecommendations";
import { QuickPrompts } from "@/components/assistant/QuickPrompts";
import { Button } from "@/components/ui/button";
import { searchJourneys } from "@/data/transit";
import {
  analyzeJourneys,
  queryAssistant,
  type AssistantMessage,
  type JourneyContext,
} from "@/lib/ai-assistant";
import { askAssistant } from "@/lib/assistant-server";
import { todayISO } from "@/lib/search-params";
import { cn } from "@/lib/utils";

// ── Lightweight inline markdown renderer (no external deps) ──────────────────
function renderInline(text: string): React.ReactNode[] {
  // Split on **bold**, *italic*, `code`
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={i} className="font-semibold text-foreground">{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith("*") && part.endsWith("*") && part.length > 2) {
      return <em key={i}>{part.slice(1, -1)}</em>;
    }
    if (part.startsWith("`") && part.endsWith("`")) {
      return <code key={i} className="rounded bg-white/10 px-1 py-0.5 font-mono text-xs">{part.slice(1, -1)}</code>;
    }
    return <span key={i}>{part}</span>;
  });
}

function MarkdownContent({ content }: { content: string }) {
  const lines = content.split("\n");
  const nodes: React.ReactNode[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i] ?? "";

    // Ordered list item: starts with "1." / "2." etc.
    if (/^\d+\.\s/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\d+\.\s/.test(lines[i] ?? "")) {
        items.push((lines[i] ?? "").replace(/^\d+\.\s/, ""));
        i++;
      }
      nodes.push(
        <ol key={`ol-${i}`} className="mt-1.5 list-decimal pl-5 space-y-0.5">
          {items.map((item, j) => (
            <li key={j} className="text-sm">{renderInline(item)}</li>
          ))}
        </ol>,
      );
      continue;
    }

    // Unordered list item: starts with "- ", "• ", "✅ ", "✓ " etc.
    if (/^[-•✅✓]\s/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^[-•✅✓]\s/.test(lines[i] ?? "")) {
        items.push((lines[i] ?? "").replace(/^[-•✅✓]\s/, ""));
        i++;
      }
      nodes.push(
        <ul key={`ul-${i}`} className="mt-1.5 list-disc pl-5 space-y-0.5">
          {items.map((item, j) => (
            <li key={j} className="text-sm">{renderInline(item)}</li>
          ))}
        </ul>,
      );
      continue;
    }

    // Heading: starts with "##" or "#"
    if (line.startsWith("## ")) {
      nodes.push(<h3 key={i} className="mt-3 mb-1 text-sm font-bold text-foreground">{renderInline(line.slice(3))}</h3>);
      i++;
      continue;
    }
    if (line.startsWith("# ")) {
      nodes.push(<h2 key={i} className="mt-3 mb-1 text-base font-bold text-foreground">{renderInline(line.slice(2))}</h2>);
      i++;
      continue;
    }

    // Horizontal rule
    if (line.trim() === "---") {
      nodes.push(<hr key={i} className="my-2 border-white/10" />);
      i++;
      continue;
    }

    // Empty line = paragraph break
    if (line.trim() === "") {
      nodes.push(<div key={i} className="h-1.5" />);
      i++;
      continue;
    }

    // Normal paragraph
    nodes.push(
      <p key={i} className="text-sm leading-relaxed">{renderInline(line)}</p>,
    );
    i++;
  }

  return <div className="space-y-0.5">{nodes}</div>;
}

// ── Context extractor ─────────────────────────────────────────────────────────
const CITIES = [
  "Mumbai", "Delhi", "Bengaluru", "Hyderabad", "Chennai", "Kolkata",
  "Pune", "Ahmedabad", "Jaipur", "Lucknow", "Kochi", "Nagpur", "Indore", "Goa",
];

function extractContext(messages: AssistantMessage[], initial: JourneyContext): JourneyContext {
  let ctx = { ...initial };

  for (const msg of messages) {
    const text = msg.content.toLowerCase();

    const budgetMatch = text.match(/(?:budget|under|within|₹|rs\.?)\s*(\d[\d,]+)/i);
    if (budgetMatch?.[1]) ctx = { ...ctx, budget: parseInt(budgetMatch[1].replace(/,/g, ""), 10) };

    if (/\btrain\b/.test(text) && /\bonly\b/.test(text)) ctx = { ...ctx, type: "train" };
    if (/\bbus\b/.test(text) && /\bonly\b/.test(text)) ctx = { ...ctx, type: "bus" };

    if (/cheap|low.?cost|budget/.test(text)) ctx = { ...ctx, priority: "cheapest" };
    if (/fast|quick|minimum.?time/.test(text)) ctx = { ...ctx, priority: "fastest" };
    if (/comfort|best.?rated|luxury/.test(text)) ctx = { ...ctx, priority: "comfortable" };

    // Extract cities only from user messages
    if (msg.role === "user") {
      const found = CITIES.filter((c) => text.includes(c.toLowerCase()));
      if (found.length >= 2 && !ctx.from && !ctx.to) {
        ctx = { ...ctx, from: found[0], to: found[1] };
      } else if (found.length === 1) {
        if (!ctx.from) ctx = { ...ctx, from: found[0] };
        else if (!ctx.to && found[0] !== ctx.from) ctx = { ...ctx, to: found[0] };
      }
    }
  }
  return ctx;
}

// ── Types ─────────────────────────────────────────────────────────────────────
interface AssistantPanelProps {
  initialContext?: JourneyContext;
  compact?: boolean;
  onClose?: () => void;
}

// ── Component ─────────────────────────────────────────────────────────────────
export function AssistantPanel({ initialContext = {}, compact = false, onClose }: AssistantPanelProps) {
  const [messages, setMessages] = useState<AssistantMessage[]>([
    {
      role: "assistant",
      content:
        "Hi! I'm your **TransitEase AI Travel Assistant** 👋\n\nI can help you plan journeys, compare train and bus options, find the best fare, or answer travel questions.\n\nTell me where you'd like to go, or pick a quick option below.",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [context, setContext] = useState<JourneyContext>({
    date: todayISO(),
    type: "both",
    passengers: 1,
    ...initialContext,
  });
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  useEffect(() => {
    if (initialContext && Object.keys(initialContext).length > 0) {
      setContext((prev) => ({ ...prev, ...initialContext }));
    }
  }, [JSON.stringify(initialContext)]); // eslint-disable-line react-hooks/exhaustive-deps

  const sendMessage = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || loading) return;

    const userMsg: AssistantMessage = { role: "user", content: trimmed, timestamp: new Date() };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setInput("");
    setLoading(true);

    const updatedContext = extractContext(updatedMessages, context);
    setContext(updatedContext);

    try {
      const result = await queryAssistant(
        { messages: updatedMessages.map((m) => ({ role: m.role, content: m.content })), context: updatedContext },
        askAssistant,
      );
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: result.reply, timestamp: new Date(), isDemo: result.isDemo },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Sorry, I ran into a problem. Please try again in a moment.", timestamp: new Date(), isDemo: true },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    void sendMessage(input);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void sendMessage(input);
    }
  };

  const journeys =
    context.from && context.to && context.date
      ? searchJourneys(context.from, context.to, context.date, context.type ?? "both")
      : [];
  const recommendations = analyzeJourneys(journeys, context);
  const hasRouteContext = Boolean(context.from && context.to);

  return (
    <div className={cn("flex flex-col bg-background", compact ? "h-[600px] max-h-[80vh]" : "min-h-[calc(100vh-4rem)]")}>
      {/* Header */}
      <div className="flex shrink-0 items-center justify-between gap-3 border-b border-white/8 bg-card px-4 py-3">
        <div className="flex items-center gap-2.5">
          <span className="flex size-9 items-center justify-center rounded-xl bg-primary/15 text-primary">
            <Sparkles className="size-5" aria-hidden />
          </span>
          <div>
            <p className="text-sm font-bold">AI Travel Assistant</p>
            <p className="text-xs text-muted-foreground">TransitEase · Powered by OpenAI</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {hasRouteContext && (
            <span className="hidden rounded-full border border-primary/25 bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary sm:inline-flex">
              {context.from} → {context.to}
            </span>
          )}
          {onClose && (
            <Button variant="ghost" size="icon" onClick={onClose}
              className="size-7 text-muted-foreground hover:text-foreground" aria-label="Close assistant">
              <X className="size-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        <div className="mx-auto max-w-3xl space-y-4">
          {messages.map((msg, i) => (
            <div key={i} className={cn("flex gap-3", msg.role === "user" ? "justify-end" : "justify-start")}>
              {msg.role === "assistant" && (
                <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary" aria-hidden>
                  <Bot className="size-4" />
                </span>
              )}
              <div
                className={cn(
                  "max-w-[85%] rounded-2xl px-4 py-3",
                  msg.role === "user"
                    ? "bg-primary text-primary-foreground rounded-tr-sm"
                    : "border border-white/8 bg-card text-foreground rounded-tl-sm",
                )}
              >
                {msg.role === "assistant"
                  ? <MarkdownContent content={msg.content} />
                  : <p className="text-sm">{msg.content}</p>
                }
                {msg.isDemo && (
                  <p className="mt-2 border-t border-white/10 pt-2 text-[11px] text-muted-foreground">
                    Demo response · Add OPENAI_API_KEY in Vercel for live AI
                  </p>
                )}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex gap-3">
              <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary">
                <Bot className="size-4" />
              </span>
              <div className="flex items-center gap-2 rounded-2xl rounded-tl-sm border border-white/8 bg-card px-4 py-3">
                <Loader2 className="size-4 animate-spin text-primary" />
                <span className="text-sm text-muted-foreground">Thinking…</span>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>
      </div>

      {/* Journey Recommendations */}
      {recommendations.length > 0 && (
        <div className="shrink-0 border-t border-white/8 px-4 py-4">
          <div className="mx-auto max-w-3xl">
            <JourneyRecommendations recommendations={recommendations} search={context} />
          </div>
        </div>
      )}

      {/* Quick Prompts */}
      <div className="shrink-0 border-t border-white/8 bg-card/50 px-4 py-3">
        <div className="mx-auto max-w-3xl">
          <QuickPrompts onSelect={(p) => void sendMessage(p)} disabled={loading} />
        </div>
      </div>

      {/* Input */}
      <div className="shrink-0 border-t border-white/8 bg-card px-4 py-3">
        <div className="mx-auto max-w-3xl">
          <form onSubmit={handleSubmit} className="flex items-end gap-2">
            <div className="flex-1 rounded-xl border border-white/12 bg-white/4 focus-within:border-primary/40 transition-colors">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask me anything about your journey…"
                rows={1}
                aria-label="Message the travel assistant"
                disabled={loading}
                className="block w-full resize-none bg-transparent px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none disabled:opacity-60"
                style={{ maxHeight: "120px" }}
                onInput={(e) => {
                  const el = e.currentTarget;
                  el.style.height = "auto";
                  el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
                }}
              />
            </div>
            <Button type="submit" size="icon" disabled={loading || !input.trim()} className="shrink-0 shadow-sm" aria-label="Send">
              {loading ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
            </Button>
          </form>
          <p className="mt-1.5 text-center text-[11px] text-muted-foreground">
            Enter to send · Shift+Enter for new line · Responses use demo schedule data
          </p>
        </div>
      </div>
    </div>
  );
}
