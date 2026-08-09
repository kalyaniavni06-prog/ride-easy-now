import { cn } from "@/lib/utils";

export interface QuickPrompt {
  label: string;
  prompt: string;
  icon: string;
}

export const QUICK_PROMPTS: QuickPrompt[] = [
  { icon: "🗺️", label: "Plan my journey", prompt: "Help me plan my journey. I'll tell you where I want to go." },
  { icon: "⚖️", label: "Compare train vs bus", prompt: "Compare the train and bus options available for my route." },
  { icon: "💰", label: "Cheapest option", prompt: "Which is the cheapest option available?" },
  { icon: "⚡", label: "Fastest option", prompt: "Which is the fastest option available?" },
  { icon: "🏆", label: "Best overall", prompt: "Which option gives the best overall value?" },
  { icon: "📋", label: "Travel checklist", prompt: "What should I carry for my journey?" },
  { icon: "⏰", label: "Journey summary", prompt: "Explain my journey step by step." },
  { icon: "🚨", label: "If journey is delayed", prompt: "What should I do if my bus or train is delayed?" },
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
          )}
        >
          <span aria-hidden>{qp.icon}</span>
          {qp.label}
        </button>
      ))}
    </div>
  );
}
