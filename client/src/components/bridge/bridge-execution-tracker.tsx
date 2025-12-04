import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { 
  CheckCircle2, 
  Circle, 
  Loader2, 
  XCircle, 
  ExternalLink, 
  Clock,
  Shield,
  ArrowRight,
  RefreshCw,
  Copy,
} from "lucide-react";
import { useBridgeExecution, formatTime, type BridgeExecution } from "@/hooks/use-bridge";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

interface BridgeExecutionTrackerProps {
  executionId: string | null;
  onComplete?: (execution: BridgeExecution) => void;
  onError?: (error: string) => void;
  onClose?: () => void;
}

const EXPLORER_URLS: Record<string, string> = {
  zcash: "https://explorer.zcha.in/transactions/",
  ethereum: "https://etherscan.io/tx/",
  near: "https://explorer.testnet.near.org/transactions/",
  polygon: "https://polygonscan.com/tx/",
  binance: "https://bscscan.com/tx/",
  avalanche: "https://snowtrace.io/tx/",
};

function getStepIcon(status: string) {
  switch (status) {
    case "completed":
      return <CheckCircle2 className="h-5 w-5 text-green-500" />;
    case "in_progress":
      return <Loader2 className="h-5 w-5 text-primary animate-spin" />;
    case "failed":
      return <XCircle className="h-5 w-5 text-destructive" />;
    default:
      return <Circle className="h-5 w-5 text-muted-foreground" />;
  }
}

function getStatusBadge(status: string) {
  switch (status) {
    case "completed":
      return <Badge variant="default" className="bg-green-500/20 text-green-400 border-green-500/30">Completed</Badge>;
    case "in_progress":
    case "pending_signature":
    case "executing":
      return <Badge variant="default" className="bg-primary/20 text-primary border-primary/30">In Progress</Badge>;
    case "failed":
      return <Badge variant="destructive">Failed</Badge>;
    default:
      return <Badge variant="secondary">Pending</Badge>;
  }
}

export function BridgeExecutionTracker({ executionId, onComplete, onError, onClose }: BridgeExecutionTrackerProps) {
  const { data, isLoading, error, refetch } = useBridgeExecution(executionId);
  const [prevStatus, setPrevStatus] = useState<string | null>(null);
  const { toast } = useToast();

  const execution = data?.execution;

  useEffect(() => {
    if (execution && execution.status !== prevStatus) {
      setPrevStatus(execution.status);
      
      if (execution.status === "completed" && onComplete) {
        onComplete(execution);
        toast({
          title: "Bridge Completed",
          description: "Your assets have been successfully bridged!",
        });
      }
      
      if (execution.status === "failed" && onError && execution.error) {
        onError(execution.error);
        toast({
          title: "Bridge Failed",
          description: execution.error,
          variant: "destructive",
        });
      }
    }
  }, [execution, prevStatus, onComplete, onError, toast]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied",
      description: "Transaction hash copied to clipboard",
    });
  };

  if (!executionId) {
    return null;
  }

  if (isLoading && !execution) {
    return (
      <Card className="bg-card/50 backdrop-blur-sm border-primary/20">
        <CardContent className="p-6">
          <div className="flex items-center justify-center gap-3">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
            <span className="text-muted-foreground">Loading execution details...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !execution) {
    return (
      <Card className="bg-card/50 backdrop-blur-sm border-destructive/20">
        <CardContent className="p-6">
          <div className="flex flex-col items-center gap-4">
            <XCircle className="h-8 w-8 text-destructive" />
            <p className="text-muted-foreground">Failed to load execution details</p>
            <Button variant="outline" size="sm" onClick={() => refetch()} data-testid="button-retry-fetch">
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const completedSteps = execution.steps.filter(s => s.status === "completed").length;
  const totalSteps = execution.steps.length;
  const progressPercent = totalSteps > 0 ? (completedSteps / totalSteps) * 100 : 0;

  return (
    <Card className="bg-card/50 backdrop-blur-sm border-primary/20" data-testid="card-execution-tracker">
      <CardHeader className="flex flex-row items-center justify-between gap-4 pb-4">
        <div className="flex items-center gap-3">
          <Shield className="h-5 w-5 text-primary" />
          <CardTitle className="text-lg font-medium">Bridge Execution</CardTitle>
        </div>
        <div className="flex items-center gap-2">
          {getStatusBadge(execution.status)}
          {onClose && execution.status !== "in_progress" && execution.status !== "executing" && (
            <Button variant="ghost" size="sm" onClick={onClose} data-testid="button-close-tracker">
              Close
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Progress</span>
            <span className="font-medium">{completedSteps} / {totalSteps} steps</span>
          </div>
          <Progress value={progressPercent} className="h-2" data-testid="progress-execution" />
        </div>

        <div className="space-y-3">
          {execution.steps.map((step, index) => (
            <div 
              key={step.step} 
              className={cn(
                "flex items-start gap-3 p-3 rounded-lg transition-colors",
                step.status === "in_progress" && "bg-primary/5 border border-primary/20",
                step.status === "completed" && "bg-green-500/5",
                step.status === "failed" && "bg-destructive/5"
              )}
              data-testid={`step-${step.step}-${step.status}`}
            >
              <div className="flex-shrink-0 mt-0.5">
                {getStepIcon(step.status)}
              </div>
              <div className="flex-1 min-w-0 space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-medium text-sm">Step {step.step}</span>
                  {step.status === "in_progress" && (
                    <Badge variant="outline" className="text-xs gap-1">
                      <Clock className="h-3 w-3" />
                      Processing
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">{step.message}</p>
                {step.transactionHash && (
                  <div className="flex items-center gap-2 mt-2">
                    <code className="text-xs bg-muted/50 px-2 py-1 rounded font-mono truncate max-w-[200px]">
                      {step.transactionHash.slice(0, 16)}...
                    </code>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-6 w-6"
                      onClick={() => copyToClipboard(step.transactionHash!)}
                      data-testid={`button-copy-hash-${step.step}`}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                )}
                {step.timestamp && (
                  <p className="text-xs text-muted-foreground">
                    {new Date(step.timestamp).toLocaleTimeString()}
                  </p>
                )}
              </div>
              {index < execution.steps.length - 1 && (
                <ArrowRight className="h-4 w-4 text-muted-foreground/50 flex-shrink-0" />
              )}
            </div>
          ))}
        </div>

        {(execution.sourceTransaction || execution.targetTransaction) && (
          <div className="pt-4 border-t border-border/50 space-y-3">
            <h4 className="font-medium text-sm">Transaction Details</h4>
            
            {execution.sourceTransaction && (
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Source Transaction</p>
                  <div className="flex items-center gap-2">
                    <code className="text-xs font-mono">
                      {execution.sourceTransaction.hash.slice(0, 12)}...{execution.sourceTransaction.hash.slice(-8)}
                    </code>
                    <Badge variant="outline" className="text-xs">
                      {execution.sourceTransaction.confirmations} confirmations
                    </Badge>
                  </div>
                </div>
                <a 
                  href={execution.sourceTransaction.explorerUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-primary hover:text-primary/80 transition-colors"
                  data-testid="link-source-explorer"
                >
                  <ExternalLink className="h-4 w-4" />
                </a>
              </div>
            )}
            
            {execution.targetTransaction && (
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Target Transaction</p>
                  <div className="flex items-center gap-2">
                    <code className="text-xs font-mono">
                      {execution.targetTransaction.hash.slice(0, 12)}...{execution.targetTransaction.hash.slice(-8)}
                    </code>
                    <Badge variant="outline" className="text-xs">
                      {execution.targetTransaction.confirmations} confirmations
                    </Badge>
                  </div>
                </div>
                <a 
                  href={execution.targetTransaction.explorerUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-primary hover:text-primary/80 transition-colors"
                  data-testid="link-target-explorer"
                >
                  <ExternalLink className="h-4 w-4" />
                </a>
              </div>
            )}
          </div>
        )}

        {execution.error && (
          <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/20">
            <div className="flex items-start gap-3">
              <XCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-medium text-sm text-destructive">Execution Failed</p>
                <p className="text-sm text-muted-foreground">{execution.error}</p>
              </div>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t border-border/30">
          <span>Execution ID: {execution.id.slice(0, 8)}...</span>
          <span>Last updated: {new Date(execution.updatedAt).toLocaleTimeString()}</span>
        </div>
      </CardContent>
    </Card>
  );
}
