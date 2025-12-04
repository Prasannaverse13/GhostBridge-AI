import { format } from "date-fns";
import type { ChatMessage } from "@shared/schema";
import { BridgePlanCard } from "./bridge-plan-card";
import { Shield, User, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface MessageBubbleProps {
  message: ChatMessage;
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === "user";
  const timestamp = new Date(message.timestamp);

  return (
    <div
      className={cn(
        "flex gap-3 animate-in fade-in-0 slide-in-from-bottom-2 duration-300",
        isUser ? "flex-row-reverse" : "flex-row"
      )}
      data-testid={`message-${message.id}`}
    >
      <div
        className={cn(
          "flex h-8 w-8 shrink-0 items-center justify-center rounded-md",
          isUser ? "bg-primary text-primary-foreground" : "bg-muted"
        )}
      >
        {isUser ? (
          <User className="h-4 w-4" />
        ) : (
          <div className="relative">
            <Shield className="h-4 w-4" />
            <Sparkles className="h-2.5 w-2.5 absolute -top-1 -right-1 text-primary" />
          </div>
        )}
      </div>

      <div
        className={cn(
          "flex flex-col gap-2 max-w-[85%] md:max-w-[75%]",
          isUser ? "items-end" : "items-start"
        )}
      >
        <div
          className={cn(
            "rounded-lg px-4 py-3",
            isUser
              ? "bg-primary text-primary-foreground"
              : "bg-card border border-card-border"
          )}
        >
          <p className="text-sm whitespace-pre-wrap leading-relaxed">{message.content}</p>
        </div>

        {message.bridgePlan && <BridgePlanCard plan={message.bridgePlan} />}

        <span className="text-xs text-muted-foreground px-1">
          {format(timestamp, "h:mm a")}
        </span>
      </div>
    </div>
  );
}
