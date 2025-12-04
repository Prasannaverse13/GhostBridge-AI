import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Shield, 
  Clock, 
  ArrowRight, 
  Zap, 
  CheckCircle2,
  ExternalLink,
  Loader2
} from "lucide-react";
import { type BridgeQuote, formatTime, getSecurityBadgeColor } from "@/hooks/use-bridge";

interface BridgeQuoteCardProps {
  quote: BridgeQuote;
  isSelected?: boolean;
  isExecuting?: boolean;
  onSelect?: (quote: BridgeQuote) => void;
  onExecute?: (quote: BridgeQuote) => void;
}

const chainIcons: Record<string, string> = {
  zcash: "ZEC",
  ethereum: "ETH",
  near: "NEAR",
  polygon: "MATIC",
  binance: "BNB",
  avalanche: "AVAX",
};

export function BridgeQuoteCard({
  quote,
  isSelected,
  isExecuting,
  onSelect,
  onExecute,
}: BridgeQuoteCardProps) {
  const expiresIn = Math.max(0, Math.floor((new Date(quote.expiresAt).getTime() - Date.now()) / 1000));
  const isExpired = expiresIn <= 0;

  return (
    <Card
      className={`transition-all ${
        isSelected 
          ? "ring-2 ring-primary border-primary" 
          : "hover-elevate cursor-pointer"
      } ${isExpired ? "opacity-50" : ""}`}
      onClick={() => onSelect?.(quote)}
      data-testid={`bridge-quote-${quote.id}`}
    >
      <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
        <div className="flex items-center gap-2">
          <CardTitle className="text-base">{quote.protocol}</CardTitle>
          <Badge variant="outline" className={getSecurityBadgeColor(quote.securityLevel)}>
            <Shield className="w-3 h-3 mr-1" />
            {quote.securityLevel}
          </Badge>
        </div>
        {quote.isShielded && (
          <Badge variant="secondary" className="bg-primary/20 text-primary">
            <Zap className="w-3 h-3 mr-1" />
            Shielded
          </Badge>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-lg font-mono">{quote.inputAmount}</span>
            <Badge variant="outline">{chainIcons[quote.sourceChain]}</Badge>
          </div>
          <ArrowRight className="w-4 h-4 text-muted-foreground" />
          <div className="flex items-center gap-2">
            <span className="text-lg font-mono text-primary">{quote.outputAmount}</span>
            <Badge variant="outline">{quote.targetToken}</Badge>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="space-y-1">
            <p className="text-muted-foreground">Total Fees</p>
            <p className="font-mono">{quote.fees.totalFee}</p>
            <p className="text-xs text-muted-foreground">{quote.fees.totalFeeUsd}</p>
          </div>
          <div className="space-y-1">
            <p className="text-muted-foreground">Estimated Time</p>
            <p className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {formatTime(quote.estimatedTime)}
            </p>
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-xs text-muted-foreground">Route ({quote.route.length} steps)</p>
          <div className="flex items-center gap-1 flex-wrap">
            {quote.route.map((step, idx) => (
              <div key={step.step} className="flex items-center gap-1">
                <Badge variant="outline" className="text-xs">
                  {step.action}
                </Badge>
                {idx < quote.route.length - 1 && (
                  <ArrowRight className="w-3 h-3 text-muted-foreground" />
                )}
              </div>
            ))}
          </div>
        </div>

        {!isExpired && (
          <div className="flex items-center justify-between pt-2 border-t">
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="w-3 h-3" />
              Expires in {formatTime(expiresIn)}
            </div>
            {onExecute && (
              <Button
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onExecute(quote);
                }}
                disabled={isExecuting}
                data-testid="button-execute-bridge"
              >
                {isExecuting ? (
                  <>
                    <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                    Executing...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-3 h-3 mr-1" />
                    Execute
                  </>
                )}
              </Button>
            )}
          </div>
        )}

        {isExpired && (
          <div className="text-center text-sm text-destructive pt-2 border-t">
            Quote expired - please request a new one
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface BridgeExecutionCardProps {
  execution: {
    id: string;
    status: string;
    steps: {
      step: number;
      status: string;
      transactionHash?: string;
      message: string;
    }[];
    sourceTransaction?: {
      hash: string;
      explorerUrl: string;
    };
    targetTransaction?: {
      hash: string;
      explorerUrl: string;
    };
    error?: string;
  };
}

export function BridgeExecutionCard({ execution }: BridgeExecutionCardProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "text-green-400";
      case "in_progress":
        return "text-yellow-400";
      case "failed":
        return "text-destructive";
      default:
        return "text-muted-foreground";
    }
  };

  return (
    <Card data-testid={`bridge-execution-${execution.id}`}>
      <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
        <CardTitle className="text-base">Bridge Progress</CardTitle>
        <Badge 
          variant={execution.status === "completed" ? "default" : "secondary"}
          className={execution.status === "completed" ? "bg-green-500/20 text-green-400" : ""}
        >
          {execution.status.replace(/_/g, " ")}
        </Badge>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          {execution.steps.map((step) => (
            <div key={step.step} className="flex items-start gap-3">
              <div className={`mt-0.5 ${getStatusColor(step.status)}`}>
                {step.status === "completed" ? (
                  <CheckCircle2 className="w-4 h-4" />
                ) : step.status === "in_progress" ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <div className="w-4 h-4 rounded-full border-2 border-current" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm">{step.message}</p>
                {step.transactionHash && (
                  <p className="text-xs font-mono text-muted-foreground truncate">
                    {step.transactionHash.slice(0, 10)}...{step.transactionHash.slice(-8)}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>

        {execution.error && (
          <div className="p-3 bg-destructive/10 rounded-md text-sm text-destructive">
            {execution.error}
          </div>
        )}

        {(execution.sourceTransaction || execution.targetTransaction) && (
          <div className="flex flex-wrap gap-2 pt-2 border-t">
            {execution.sourceTransaction && (
              <Button
                variant="outline"
                size="sm"
                asChild
                data-testid="link-source-explorer"
              >
                <a 
                  href={execution.sourceTransaction.explorerUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                >
                  <ExternalLink className="w-3 h-3 mr-1" />
                  Source Tx
                </a>
              </Button>
            )}
            {execution.targetTransaction && (
              <Button
                variant="outline"
                size="sm"
                asChild
                data-testid="link-target-explorer"
              >
                <a 
                  href={execution.targetTransaction.explorerUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                >
                  <ExternalLink className="w-3 h-3 mr-1" />
                  Target Tx
                </a>
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
