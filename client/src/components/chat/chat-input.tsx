import { useState, useRef, useEffect, type KeyboardEvent } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send, Loader2 } from "lucide-react";

interface ChatInputProps {
  onSend: (message: string) => void;
  isLoading: boolean;
  disabled?: boolean;
  placeholder?: string;
}

const quickActions = [
  "Bridge 5 ZEC to Ethereum",
  "Check my balance",
  "Bridge to NEAR",
  "View transaction history",
];

export function ChatInput({ onSend, isLoading, disabled, placeholder }: ChatInputProps) {
  const [message, setMessage] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 120) + "px";
    }
  }, [message]);

  const handleSubmit = () => {
    if (message.trim() && !isLoading && !disabled) {
      onSend(message.trim());
      setMessage("");
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
      }
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleQuickAction = (action: string) => {
    if (!isLoading && !disabled) {
      onSend(action);
    }
  };

  return (
    <div className="border-t border-border bg-background p-4">
      <div className="max-w-4xl mx-auto space-y-3">
        <div className="flex flex-wrap gap-2">
          {quickActions.map((action) => (
            <Button
              key={action}
              variant="outline"
              size="sm"
              className="text-xs"
              onClick={() => handleQuickAction(action)}
              disabled={isLoading || disabled}
              data-testid={`button-quick-${action.toLowerCase().replace(/\s+/g, '-')}`}
            >
              {action}
            </Button>
          ))}
        </div>
        
        <div className="flex gap-3 items-end">
          <div className="flex-1 relative">
            <Textarea
              ref={textareaRef}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={placeholder || "Tell GhostBridge what you want to do..."}
              disabled={isLoading || disabled}
              className="min-h-[44px] max-h-[120px] resize-none pr-12 text-base"
              rows={1}
              data-testid="input-chat-message"
            />
          </div>
          <Button
            onClick={handleSubmit}
            disabled={!message.trim() || isLoading || disabled}
            size="icon"
            className="h-11 w-11 shrink-0"
            data-testid="button-send-message"
          >
            {isLoading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Send className="h-5 w-5" />
            )}
          </Button>
        </div>
        
        <p className="text-xs text-muted-foreground text-center">
          Press Enter to send, Shift+Enter for new line
        </p>
      </div>
    </div>
  );
}
