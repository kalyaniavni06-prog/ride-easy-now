/**
 * AssistantPanel — polished AI chat interface.
 *
 * Calls the server function `askAssistant` which invokes OpenAI server-side
 * so the API key is never exposed to the browser.
 *
 * When no OPENAI_API_KEY is configured the server function returns a
 * smart pre-written response based on actual transit data.
 */
import { Bot, Loader as Loader2, RefreshCw, Send, Sparkles, Trash2, X } from "lucide-react";
import { useEffect, useRef, useState, useCallback } from "react";

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

// ── Lightweight markdown renderer ────────────────────────────────────────────
function renderInline(text: string): React.ReactNode[] {
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**"))
      return <strong key={i} className="font-semibold text-foreground">{part.slice(2, -2)}</strong>;
    if (part.startsWith("*") && part.endsWith("*") && part.length > 2)
      return <em key={i}>{part.slice(1, -1)}</em>;
    if (part.startsWith("`") && part.endsWith("`"))
      return <code key={i} className="rounded bg-white/10 px-1 py-0.5 font-mono text-xs">{part.slice(1, -1)}</code>;
    return <span key={i}>{part}</span>;
  });
}

function MarkdownContent({ content }: { content: string }) {
  const lines = content.split("\n");
  const nodes: React.ReactNode[] = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i] ?? "";
    if (/^\d+\.\s/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\d+\.\s/.test(lines[i] ?? "")) {
        items.push((lines[i] ?? "").replace(/^\d+\.\s/, "")); i++;
      }
      nodes.push(<ol key={`ol-${i}`} className="mt-1.5 list-decimal pl-5 space-y-0.5">{items.map((t, j) => <li key={j} className="text-sm">{renderInline(t)}</li>)}</ol>);
      continue;
    }
    if (/^[-•✅✓]\s/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^[-•✅✓]\s/.test(lines[i] ?? "")) {
        items.push((lines[i] ?? "").replace(/^[-•✅✓]\s/, "")); i++;
      }
      nodes.push(<ul key={`ul-${i}`} className="mt-1.5 list-disc pl-5 space-y-0.5">{items.map((t, j) => <li key={j} className="text-sm">{renderInline(t)}</li>)}</ul>);
      continue;
    }
    if (line.startsWith("## ")) { nodes.push(<h3 key={i} className="mt-3 mb-1 text-sm font-bold text-foreground">{renderInline(line.slice(3))}</h3>); i++; continue; }
    if (line.startsWith("# "))  { nodes.push(<h2 key={i} className="mt-3 mb-1 text-base font-bold text-foreground">{renderInline(line.slice(2))}</h2>); i++; continue; }
    if (line.trim() === "---")   { nodes.push(<hr key={i} className="my-2 border-white/10" />); i++; continue; }
    if (line.trim() === "")      { nodes.push(<div key={i} className="h-1.5" />); i++; continue; }
    nodes.push(<p key={i} className="text-sm leading-relaxed">{renderInline(line)}</p>);
    i++;
  }
  return <div className="space-y-0.5">{nodes}</div>;
}

// ── Animated typing dots ──────────────────────────────────────────────────────
function TypingDots() {
  return (
    <div className="flex items-center gap-1">
      {[0, 1, 2].map((dot) => (
        <span
          key={dot}
          className="size-1.5 rounded-full bg-primary"
          style={{
            animation: "typing-bounce 1.4s infinite ease-in-out",
            animationDelay: `${dot * 0.16}s`,
          }}
        />
      ))}
    </div>
  );
}

// ── Context extractor ─────────────────────────────────────────────────────────
const CITIES = ["Mumbai","Delhi","Bengaluru","Hyderabad","Chennai","Kolkata","Pune","Ahmedabad","Jaipur","Lucknow","Kochi","Nagpur","Indore","Goa"];

function extractContext(messages: AssistantMessage[], initial: JourneyContext): JourneyContext {
  let ctx = { ...initial };
  for (const msg of messages) {
    const text = msg.content.toLowerCase();
    const bm = text.match(/(?:budget|under|within|₹|rs\.?)\s*(\d[\d,]+)/i);
    if (bm?.[1]) ctx = { ...ctx, budget: parseInt(bm[1].replace(/,/g, ""), 10) };
    if (/\btrain\b/.test(text) && /\bonly\b/.test(text)) ctx = { ...ctx, type: "train" };
    if (/\bbus\b/.test(text) && /\bonly\b/.test(text)) ctx = { ...ctx, type: "bus" };
    if (/cheap|low.?cost|budget|afford/.test(text)) ctx = { ...ctx, priority: "cheapest" };
    if (/fast|quick|minimum.?time|soonest|earliest/.test(text)) ctx = { ...ctx, priority: "fastest" };
    if (/comfort|best.?rated|luxury|premium/.test(text)) ctx = { ...ctx, priority: "comfortable" };
    if (msg.role === "user") {
      const found = CITIES.filter((c) => text.includes(c.toLowerCase()));
      if (found.length >= 2 && !ctx.from && !ctx.to) {
        const f0 = found[0]; const f1 = found[1];
        if (f0 && f1) ctx = { ...ctx, from: f0, to: f1 };
      } else if (found.length === 1) {
        const f0 = found[0];
        if (!ctx.from && f0) ctx = { ...ctx, from: f0 };
        else if (!ctx.to && f0 && f0 !== ctx.from) ctx = { ...ctx, to: f0 };
      }
    }
  }
  return ctx;
}

// ── Follow-up suggestions ─────────────────────────────────────────────────────
function generateFollowUps(messages: AssistantMessage[], context: JourneyContext): string[] {
  const lastAssistant = [...messages].reverse().find((m) => m.role === "assistant");
  if (!lastAssistant) return [];
  const text = lastAssistant.content.toLowerCase();
  const hasRoute = Boolean(context.from && context.to);
  const suggestions: string[] = [];

  if (hasRoute) {
    if (text.includes("cheap") || text.includes("cheapest")) {
      suggestions.push("What's the fastest option?");
      suggestions.push("Compare bus vs train");
    } else if (text.includes("fast") || text.includes("fastest")) {
      suggestions.push("What's the cheapest option?");
      suggestions.push("Which option is most comfortable?");
    } else if (text.includes("compare") || text.includes("vs")) {
      suggestions.push("Which one should I pick?");
      suggestions.push("Show me morning departures");
    } else if (text.includes("recommend") || text.includes("best")) {
      suggestions.push("Is there a cheaper alternative?");
      suggestions.push("What about the fastest option?");
    } else {
      suggestions.push("What's the cheapest option?");
      suggestions.push("What's the fastest option?");
    }
    suggestions.push("What should I carry for this journey?");
  } else {
    if (text.includes("plan") || text.includes("from") || text.includes("to")) {
      suggestions.push("I want to go from Mumbai to Pune");
      suggestions.push("Show me trains from Delhi to Jaipur");
    } else {
      suggestions.push("Help me plan a journey");
      suggestions.push("What can you help me with?");
    }
  }

  return suggestions.slice(0, 3);
}

// ── Welcome message ───────────────────────────────────────────────────────────
const WELCOME: AssistantMessage = {
  role: "assistant",
  content: "Hi! I'm your **TransitEase Travel Assistant** 👋\n\nI can help you:\n\n• **Plan a journey** — tell me where and when you want to travel\n• **Compare options** — train vs bus, cheapest vs fastest\n• **Understand your booking** — explain journey details step by step\n• **Travel prep** — what to carry, boarding tips, delays\n\nTry a quick prompt below, or just ask me anything about your journey.",
  timestamp: new Date(),
};

// ── Props / Component ─────────────────────────────────────────────────────────
interface AssistantPanelProps {
  initialContext?: JourneyContext;
  compact?: boolean;
  onClose?: () => void;
}

export function AssistantPanel({ initialContext = {}, compact = false, onClose }: AssistantPanelProps) {
  const [messages, setMessages] = useState<AssistantMessage[]>([WELCOME]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastInput, setLastInput] = useState<{ text: string; ctx: JourneyContext } | null>(null);
  const [context, setContext] = useState<JourneyContext>({
    date: todayISO(), type: "both", passengers: 1, ...initialContext,
  });
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, loading]);
  useEffect(() => {
    if (initialContext && Object.keys(initialContext).length > 0)
      setContext((prev) => ({ ...prev, ...initialContext }));
  }, [JSON.stringify(initialContext)]); // eslint-disable-line react-hooks/exhaustive-deps

  const doSend = useCallback(async (text: string, ctx: JourneyContext) => {
    setLoading(true);
    setError(null);
    setLastInput({ text, ctx });
    try {
      const result = await queryAssistant(
        { messages: messages.concat({ role: "user", content: text, timestamp: new Date() }).map((m) => ({ role: m.role, content: m.content })), context: ctx },
        (input) => askAssistant({ data: input }),
      );
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: result.reply, timestamp: new Date() },
      ]);
    } catch {
      setError("Something went wrong connecting to the assistant. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [messages]);

  const sendMessage = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || loading) return;
    const userMsg: AssistantMessage = { role: "user", content: trimmed, timestamp: new Date() };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setInput("");
    if (textareaRef.current) { textareaRef.current.style.height = "auto"; }
    const updatedCtx = extractContext(updatedMessages, context);
    setContext(updatedCtx);
    await doSend(trimmed, updatedCtx);
  };

  const retry = async () => {
    if (!lastInput) return;
    setError(null);
    await doSend(lastInput.text, lastInput.ctx);
  };

  const clearChat = () => {
    setMessages([{ ...WELCOME, timestamp: new Date() }]);
    setError(null);
    setLastInput(null);
  };

  const handleSubmit = (e: React.FormEvent) => { e.preventDefault(); void sendMessage(input); };
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); void sendMessage(input); }
  };

  const journeys = context.from && context.to && context.date
    ? searchJourneys(context.from, context.to, context.date, context.type ?? "both")
    : [];
  const recommendations = analyzeJourneys(journeys, context);
  const hasRoute = Boolean(context.from && context.to);
  const followUps = generateFollowUps(messages, context);

  return (
    <div className={cn("flex flex-col bg-background", compact ? "h-[600px] max-h-[80vh]" : "min-h-[calc(100vh-4rem)]")}>
      <style>{`
        @keyframes typing-bounce {
          0%, 60%, 100% { transform: translateY(0); opacity: 0.4; }
          30% { transform: translateY(-4px); opacity: 1; }
        }
      `}</style>

      {/* ── Header ─────────────────────────────────────────────── */}
      <div className="flex shrink-0 items-center justify-between gap-3 border-b border-white/8 bg-card px-4 py-3">
        <div className="flex items-center gap-2.5">
          <span className="flex size-9 items-center justify-center rounded-xl bg-primary/15 text-primary">
            <Sparkles className="size-5" aria-hidden />
          </span>
          <div>
            <p className="text-sm font-bold">AI Travel Assistant</p>
            <p className="text-xs text-muted-foreground">
              {hasRoute ? `${context.from} → ${context.to}` : "Plan, compare & book journeys"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          {messages.length > 1 && (
            <Button variant="ghost" size="icon" onClick={clearChat} className="size-7 text-muted-foreground hover:text-foreground" aria-label="Clear chat">
              <Trash2 className="size-3.5" />
            </Button>
          )}
          {onClose && (
            <Button variant="ghost" size="icon" onClick={onClose} className="size-7 text-muted-foreground hover:text-foreground" aria-label="Close">
              <X className="size-4" />
            </Button>
          )}
        </div>
      </div>

      {/* ── Messages ───────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        <div className="mx-auto max-w-3xl space-y-4">
          {messages.map((msg, i) => {
            const isLastAssistant = msg.role === "assistant" && i === messages.length - 1 && !loading;
            return (
              <div key={i} className="space-y-2">
                <div className={cn("flex gap-3", msg.role === "user" ? "justify-end" : "justify-start")}>
                  {msg.role === "assistant" && (
                    <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary" aria-hidden>
                      <Bot className="size-4" />
                    </span>
                  )}
                  <div className={cn(
                    "max-w-[85%] rounded-2xl px-4 py-3",
                    msg.role === "user"
                      ? "bg-primary text-primary-foreground rounded-tr-sm"
                      : "border border-white/8 bg-card text-foreground rounded-tl-sm",
                  )}>
                    {msg.role === "assistant"
                      ? <MarkdownContent content={msg.content} />
                      : <p className="text-sm">{msg.content}</p>
                    }
                  </div>
                </div>
                {/* Follow-up suggestions after last assistant message */}
                {isLastAssistant && followUps.length > 0 && (
                  <div className="flex flex-wrap gap-2 pl-10">
                    {followUps.map((suggestion) => (
                      <button
                        key={suggestion}
                        type="button"
                        onClick={() => void sendMessage(suggestion)}
                        className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/8 px-3 py-1.5 text-xs font-medium text-primary transition-all hover:border-primary/40 hover:bg-primary/15 active:scale-95"
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}

          {/* Loading indicator — animated typing dots */}
          {loading && (
            <div className="flex gap-3">
              <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary">
                <Bot className="size-4" />
              </span>
              <div className="flex items-center rounded-2xl rounded-tl-sm border border-white/8 bg-card px-4 py-3.5">
                <TypingDots />
              </div>
            </div>
          )}

          {/* Error state with retry */}
          {error && !loading && (
            <div className="flex gap-3">
              <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full bg-destructive/15 text-destructive">
                <Bot className="size-4" />
              </span>
              <div className="rounded-2xl rounded-tl-sm border border-destructive/20 bg-destructive/8 px-4 py-3">
                <p className="text-sm text-destructive">{error}</p>
                <Button
                  size="sm"
                  variant="outline"
                  className="mt-2 gap-1.5 border-white/12 bg-white/4 text-xs"
                  onClick={() => void retry()}
                >
                  <RefreshCw className="size-3" /> Retry
                </Button>
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>
      </div>

      {/* ── Journey Recommendations ─────────────────────────────── */}
      {recommendations.length > 0 && (
        <div className="shrink-0 border-t border-white/8 px-4 py-4">
          <div className="mx-auto max-w-3xl">
            <JourneyRecommendations recommendations={recommendations} search={context} />
          </div>
        </div>
      )}

      {/* ── Quick Prompts ────────────────────────────────────────── */}
      <div className="shrink-0 border-t border-white/8 bg-card/50 px-4 py-3">
        <div className="mx-auto max-w-3xl">
          <QuickPrompts onSelect={(p) => void sendMessage(p)} disabled={loading} />
        </div>
      </div>

      {/* ── Input ────────────────────────────────────────────────── */}
      <div className="shrink-0 border-t border-white/8 bg-card px-4 py-3">
        <div className="mx-auto max-w-3xl">
          <form onSubmit={handleSubmit} className="flex items-end gap-2">
            <div className="flex-1 rounded-xl border border-white/12 bg-white/4 focus-within:border-primary/40 transition-colors">
              <textarea
                ref={textareaRef}
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
            Enter to send · Shift+Enter for new line
          </p>
        </div>
      </div>
    </div>
  );
}
