import { cn } from "@/lib/utils";

export interface QuickPrompt {
  label: string;
  prompt: string;
  icon: string;
  category: "plan" | "compare" | "info" | "help";
}

export const QUICK_PROMPTS: QuickPrompt[] = [
  { icon: "🗺️", label: "Plan my journey", prompt: "Help me plan a journey. I'll tell you where I want to go and when.", category: "plan" },
  { icon: "💰", label: "Cheapest route", prompt: "Which is the cheapest option available for my route?", category: "compare" },
  { icon: "⚡", label: "Fastest route", prompt: "Which is the fastest option available for my route?", category: "compare" },
  { icon: "⚖️", label: "Train vs Bus", prompt: "Compare the train and bus options for my route — price, duration and comfort.", category: "compare" },
  { icon: "🌅", label: "Morning buses", prompt: "Show me buses departing before 12:00.", category: "plan" },
  { icon: "🚆", label: "Available trains", prompt: "Show me all available trains on my route.", category: "plan" },
  { icon: "🏆", label: "Best overall", prompt: "Which option gives the best overall value — considering price, speed and comfort?", category: "compare" },
  { icon: "📋", label: "Travel checklist", prompt: "What should I carry for my journey? Give me a complete checklist.", category: "info" },
  { icon: "📖", label: "Explain my booking", prompt: "Explain my journey step by step — boarding point, what to expect, and arrival.", category: "info" },
  { icon: "⏰", label: "Journey summary", prompt: "Give me a clear summary of my journey with all key details.", category: "info" },
  { icon: "🚨", label: "Journey delayed?", prompt: "What should I do if my bus or train is delayed or cancelled?", category: "help" },
  { icon: "📍", label: "Find my platform", prompt: "How do I find my boarding point or platform at the station?", category: "help" },
];

interface QuickPromptsProps {
  onSelect: (prompt: string) => void;
  disabled?: boolean;
}

export function QuickPrompts({ onSelect, disabled }: QuickPromptsProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {QUICK_PROMPTS.map((qp) => (
        <button
          key={qp.label}
          type="button"
          disabled={disabled}
          onClick={() => onSelect(qp.prompt)}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-all",
            "border-white/10 bg-white/4 text-muted-foreground",
            "hover:border-primary/30 hover:bg-primary/10 hover:text-primary",
            "disabled:cursor-not-allowed disabled:opacity-50",
            "active:scale-95",
          )}
        >
          <span aria-hidden>{qp.icon}</span>
          {qp.label}
        </button>
      ))}
    </div>
  );
}
