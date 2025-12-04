import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  History, 
  ArrowRight, 
  ExternalLink, 
  ChevronDown, 
  ChevronUp,
  Clock,
  CheckCircle2,
  XCircle,
  Loader2,
  Shield,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useBridgeHistory, type BridgeExecution } from "@/hooks/use-bridge";

interface TransactionHistoryProps {
  walletAddress?: string;
  onSelectExecution?: (executionId: string) => void;
  limit?: number;
}

const CHAIN_ICONS: Record<string, string> = {
  zcash: "ZEC",
  ethereum: "ETH",
  near: "NEAR",
  polygon: "MATIC",
  binance: "BNB",
  avalanche: "AVAX",
};

const STATUS_CONFIG: Record<string, { icon: typeof CheckCircle2; color: string; label: string }> = {
  completed: { icon: CheckCircle2, color: "text-green-500", label: "Completed" },
  failed: { icon: XCircle, color: "text-destructive", label: "Failed" },
  in_progress: { icon: Loader2, color: "text-primary", label: "Processing" },
  executing: { icon: Loader2, color: "text-primary", label: "Executing" },
  pending: { icon: Clock, color: "text-muted-foreground", label: "Pending" },
};

interface TransactionItemProps {
  execution: BridgeExecution & { 
    sourceChain?: string; 
    targetChain?: string;
    inputAmount?: string;
    outputAmount?: string;
    protocol?: string;
  };
  isExpanded: boolean;
  onToggle: () => void;
  onSelect?: () => void;
}

function TransactionItem({ execution, isExpanded, onToggle, onSelect }: TransactionItemProps) {
  const statusConfig = STATUS_CONFIG[execution.status] || STATUS_CONFIG.pending;
  const StatusIcon = statusConfig.icon;
  
  return (
    <div 
      className={cn(
        "p-4 rounded-lg border transition-colors",
        isExpanded ? "bg-muted/30 border-primary/30" : "bg-card/30 border-border/50 hover-elevate"
      )}
      data-testid={`transaction-item-${execution.id}`}
    >
      <div 
        className="flex items-center justify-between cursor-pointer"
        onClick={onToggle}
      >
        <div className="flex items-center gap-3">
          <div className={cn("p-2 rounded-full bg-muted/50", statusConfig.color)}>
            <StatusIcon className={cn("h-4 w-4", execution.status.includes("progress") && "animate-spin")} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              {execution.sourceChain && execution.targetChain && (
                <>
                  <Badge variant="outline" className="text-xs">
                    {CHAIN_ICONS[execution.sourceChain] || execution.sourceChain}
                  </Badge>
                  <ArrowRight className="h-3 w-3 text-muted-foreground" />
                  <Badge variant="outline" className="text-xs">
                    {CHAIN_ICONS[execution.targetChain] || execution.targetChain}
                  </Badge>
                </>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {new Date(execution.createdAt).toLocaleString()}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {execution.inputAmount && (
            <span className="text-sm font-medium">{execution.inputAmount}</span>
          )}
          <Badge 
            variant={execution.status === "completed" ? "default" : "secondary"}
            className={cn(
              "text-xs",
              execution.status === "completed" && "bg-green-500/20 text-green-400 border-green-500/30",
              execution.status === "failed" && "bg-destructive/20 text-destructive border-destructive/30"
            )}
          >
            {statusConfig.label}
          </Badge>
          {isExpanded ? (
            <ChevronUp className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          )}
        </div>
      </div>
      
      {isExpanded && (
        <div className="mt-4 pt-4 border-t border-border/30 space-y-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Execution ID</p>
              <p className="font-mono text-xs">{execution.id.slice(0, 16)}...</p>
            </div>
            {execution.protocol && (
              <div>
                <p className="text-muted-foreground">Protocol</p>
                <p className="font-medium">{execution.protocol}</p>
              </div>
            )}
          </div>
          
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">Steps Progress</p>
            <div className="flex gap-1">
              {execution.steps.map((step) => (
                <div 
                  key={step.step}
                  className={cn(
                    "flex-1 h-2 rounded-full",
                    step.status === "completed" && "bg-green-500",
                    step.status === "in_progress" && "bg-primary animate-pulse",
                    step.status === "failed" && "bg-destructive",
                    step.status === "pending" && "bg-muted"
                  )}
                  title={`Step ${step.step}: ${step.message}`}
                />
              ))}
            </div>
          </div>
          
          {(execution.sourceTransaction || execution.targetTransaction) && (
            <div className="flex flex-wrap gap-2">
              {execution.sourceTransaction && (
                <a 
                  href={execution.sourceTransaction.explorerUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                  data-testid={`link-source-tx-${execution.id}`}
                >
                  Source TX <ExternalLink className="h-3 w-3" />
                </a>
              )}
              {execution.targetTransaction && (
                <a 
                  href={execution.targetTransaction.explorerUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                  data-testid={`link-target-tx-${execution.id}`}
                >
                  Target TX <ExternalLink className="h-3 w-3" />
                </a>
              )}
            </div>
          )}
          
          {execution.error && (
            <div className="p-2 rounded bg-destructive/10 text-sm text-destructive">
              {execution.error}
            </div>
          )}
          
          {onSelect && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={onSelect}
              className="w-full"
              data-testid={`button-view-details-${execution.id}`}
            >
              View Full Details
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

export function TransactionHistory({ 
  walletAddress, 
  onSelectExecution,
  limit = 10 
}: TransactionHistoryProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  
  const { data, isLoading } = useBridgeHistory(walletAddress, limit);

  const executions = (data?.executions || []) as (BridgeExecution & { 
    sourceChain?: string; 
    targetChain?: string;
    inputAmount?: string;
    outputAmount?: string;
    protocol?: string;
  })[];

  if (!walletAddress) {
    return (
      <Card className="bg-card/50 backdrop-blur-sm border-border/50">
        <CardContent className="p-6 text-center">
          <History className="h-8 w-8 mx-auto mb-3 text-muted-foreground" />
          <p className="text-muted-foreground">Connect your wallet to view transaction history</p>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card className="bg-card/50 backdrop-blur-sm border-border/50">
        <CardContent className="p-6">
          <div className="flex items-center justify-center gap-3">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
            <span className="text-muted-foreground">Loading transaction history...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-card/50 backdrop-blur-sm border-border/50" data-testid="card-transaction-history">
      <CardHeader className="flex flex-row items-center justify-between gap-4 pb-4">
        <div className="flex items-center gap-2">
          <History className="h-5 w-5 text-primary" />
          <CardTitle className="text-lg font-medium">Transaction History</CardTitle>
        </div>
        {executions.length > 0 && (
          <Badge variant="secondary" className="text-xs">
            {executions.length} transaction{executions.length !== 1 ? "s" : ""}
          </Badge>
        )}
      </CardHeader>
      <CardContent>
        {executions.length === 0 ? (
          <div className="text-center py-8">
            <Shield className="h-12 w-12 mx-auto mb-3 text-muted-foreground/50" />
            <p className="text-muted-foreground">No bridge transactions yet</p>
            <p className="text-xs text-muted-foreground mt-1">
              Your bridge history will appear here
            </p>
          </div>
        ) : (
          <ScrollArea className="max-h-[400px]">
            <div className="space-y-3 pr-4">
              {executions.map((execution) => (
                <TransactionItem 
                  key={execution.id}
                  execution={execution}
                  isExpanded={expandedId === execution.id}
                  onToggle={() => setExpandedId(expandedId === execution.id ? null : execution.id)}
                  onSelect={onSelectExecution ? () => onSelectExecution(execution.id) : undefined}
                />
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
