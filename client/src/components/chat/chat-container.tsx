import { useRef, useEffect } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageBubble } from "./message-bubble";
import type { ChatMessage } from "@shared/schema";
import { Loader2, Shield, Sparkles, MessageSquare } from "lucide-react";

interface ChatContainerProps {
  messages: ChatMessage[];
  isLoading: boolean;
}

export function ChatContainer({ messages, isLoading }: ChatContainerProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  if (messages.length === 0 && !isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-center max-w-md space-y-6">
          <div className="flex justify-center">
            <div className="relative">
              <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                <Shield className="h-10 w-10 text-primary" />
              </div>
              <div className="absolute -top-2 -right-2 h-8 w-8 rounded-full bg-card border border-border flex items-center justify-center">
                <Sparkles className="h-4 w-4 text-primary" />
              </div>
            </div>
          </div>
          
          <div className="space-y-2">
            <h2 className="text-2xl font-semibold">Welcome to GhostBridge AI</h2>
            <p className="text-muted-foreground">
              Your AI-powered assistant for private cross-chain bridges. 
              Tell me what you want to do in plain English.
            </p>
          </div>

          <div className="grid gap-3 text-left">
            <ExamplePrompt 
              title="Bridge Zcash"
              description="Bridge 5 ZEC to Ethereum using the best available route"
            />
            <ExamplePrompt 
              title="Check Fees"
              description="What are the fees to bridge 10 ZEC to Polygon?"
            />
            <ExamplePrompt 
              title="Compare Routes"
              description="Compare bridge options for ZEC to NEAR"
            />
          </div>

          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground pt-4">
            <MessageSquare className="h-4 w-4" />
            <span>Type a message below to get started</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <ScrollArea className="flex-1" ref={scrollRef}>
      <div className="max-w-4xl mx-auto p-4 md:p-6 space-y-6">
        {messages.map((message) => (
          <MessageBubble key={message.id} message={message} />
        ))}
        
        {isLoading && (
          <div className="flex gap-3 animate-in fade-in-0 slide-in-from-bottom-2" data-testid="loading-indicator">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-muted">
              <div className="relative">
                <Shield className="h-4 w-4" />
                <Sparkles className="h-2.5 w-2.5 absolute -top-1 -right-1 text-primary" />
              </div>
            </div>
            <div className="flex items-center gap-2 rounded-lg bg-card border border-card-border px-4 py-3">
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
              <span className="text-sm text-muted-foreground" data-testid="text-loading-message">
                GhostBridge is thinking...
              </span>
            </div>
          </div>
        )}
        
        <div ref={bottomRef} />
      </div>
    </ScrollArea>
  );
}

function ExamplePrompt({ title, description }: { title: string; description: string }) {
  return (
    <div 
      className="p-4 rounded-lg border border-border bg-card/50 hover-elevate cursor-pointer transition-colors"
      data-testid={`card-example-${title.toLowerCase().replace(/\s+/g, '-')}`}
    >
      <h3 className="font-medium text-sm mb-1">{title}</h3>
      <p className="text-xs text-muted-foreground">{description}</p>
    </div>
  );
}
