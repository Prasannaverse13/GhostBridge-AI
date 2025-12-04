import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { BalancePanel } from "@/components/balance-panel";
import type { BridgePlan, Transaction } from "@shared/schema";
import { ChainIcon, getChainName } from "@/components/icons/chain-icons";
import {
  ArrowRight,
  Clock,
  Shield,
  CheckCircle2,
  Loader2,
  AlertCircle,
  ExternalLink,
  Copy,
  History,
  Lock,
  TrendingUp,
  Zap,
} from "lucide-react";
import { useState, useCallback } from "react";
import { format } from "date-fns";
import { useWallet } from "@/lib/wallet-context";
import { useBridgeQuote, type BridgeQuote, type BridgeExecution } from "@/hooks/use-bridge";
import { BridgeExecutionModal } from "@/components/bridge/bridge-execution-modal";
import { useToast } from "@/hooks/use-toast";

interface TransactionPanelProps {
  currentPlan?: BridgePlan;
  recentTransactions: Transaction[];
}

export function TransactionPanel({ currentPlan, recentTransactions }: TransactionPanelProps) {
  const [copied, setCopied] = useState<string | null>(null);
  const [activeQuote, setActiveQuote] = useState<BridgeQuote | null>(null);
  const [showExecutionModal, setShowExecutionModal] = useState(false);
  const [isGettingQuote, setIsGettingQuote] = useState(false);
  
  const { wallet } = useWallet();
  const { toast } = useToast();
  const bridgeQuote = useBridgeQuote({
    sourceChain: currentPlan?.sourceChain || "zcash",
    targetChain: currentPlan?.targetChain || "near",
    amount: currentPlan?.amount?.replace(" ZEC", "") || "1",
    isShielded: currentPlan?.isShielded,
  });

  const handleCopy = async (text: string, id: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleExecuteBridge = useCallback(async () => {
    if (!currentPlan) return;
    
    setIsGettingQuote(true);
    try {
      const result = await bridgeQuote.mutateAsync();
      if (result.quote) {
        setActiveQuote(result.quote);
        setShowExecutionModal(true);
      }
    } catch (error) {
      toast({
        title: "Failed to get quote",
        description: error instanceof Error ? error.message : "Unable to get bridge quote",
        variant: "destructive",
      });
    } finally {
      setIsGettingQuote(false);
    }
  }, [currentPlan, bridgeQuote, toast]);

  const handleExecutionSuccess = useCallback((execution: BridgeExecution) => {
    toast({
      title: "Bridge Complete",
      description: `Successfully bridged ${currentPlan?.amount} to ${currentPlan?.targetChain}`,
    });
    setShowExecutionModal(false);
    setActiveQuote(null);
  }, [currentPlan, toast]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "confirmed":
        return (
          <Badge variant="outline" className="gap-1 text-chart-2 border-chart-2/30">
            <CheckCircle2 className="h-3 w-3" />
            Confirmed
          </Badge>
        );
      case "processing":
        return (
          <Badge variant="outline" className="gap-1 text-primary border-primary/30">
            <Loader2 className="h-3 w-3 animate-spin" />
            Processing
          </Badge>
        );
      case "failed":
        return (
          <Badge variant="outline" className="gap-1 text-destructive border-destructive/30">
            <AlertCircle className="h-3 w-3" />
            Failed
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="gap-1">
            <Clock className="h-3 w-3" />
            Pending
          </Badge>
        );
    }
  };

  return (
    <div className="h-full flex flex-col border-l border-border bg-card/50">
      <div className="p-4 border-b border-border">
        <h2 className="font-semibold flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-primary" />
          Transaction Details
        </h2>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-4">
          <BalancePanel />
          
          <Separator />
          
          {currentPlan ? (
            <Card data-testid="card-current-plan">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <CardTitle className="text-sm font-medium">Current Bridge</CardTitle>
                  {currentPlan.isShielded && (
                    <Badge variant="outline" className="gap-1 text-chart-2 border-chart-2/30 text-xs">
                      <Lock className="h-2.5 w-2.5" />
                      Shielded
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2 text-sm">
                  <ChainIcon chain={currentPlan.sourceChain} size={20} />
                  <span className="font-mono">{currentPlan.amount}</span>
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  <ChainIcon chain={currentPlan.targetChain} size={20} />
                </div>

                <div className="space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Protocol</span>
                    <span>{currentPlan.protocol}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Est. Time</span>
                    <span>{currentPlan.estimatedTime}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total Fee</span>
                    <span className="text-primary font-medium">
                      {currentPlan.estimatedFees.total}
                    </span>
                  </div>
                </div>

                <div className="pt-2">
                  <div className="text-xs text-muted-foreground mb-2">Progress</div>
                  <div className="space-y-1.5">
                    {currentPlan.steps.map((step) => (
                      <div
                        key={step.step}
                        className="flex items-center gap-2 text-xs"
                      >
                        {step.status === "confirmed" ? (
                          <CheckCircle2 className="h-3 w-3 text-chart-2 shrink-0" />
                        ) : step.status === "processing" ? (
                          <Loader2 className="h-3 w-3 text-primary animate-spin shrink-0" />
                        ) : (
                          <div className="h-3 w-3 rounded-full border border-muted-foreground shrink-0" />
                        )}
                        <span className="truncate">{step.title}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {wallet.isConnected && (
                  <Button 
                    onClick={handleExecuteBridge}
                    disabled={isGettingQuote || bridgeQuote.isPending}
                    className="w-full mt-3"
                    data-testid="button-execute-bridge"
                  >
                    {isGettingQuote || bridgeQuote.isPending ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Getting Quote...
                      </>
                    ) : (
                      <>
                        <Zap className="h-4 w-4 mr-2" />
                        Execute Bridge
                      </>
                    )}
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Shield className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p className="text-sm">No active bridge</p>
              <p className="text-xs mt-1">Start a bridge transaction to see details here</p>
            </div>
          )}

          <Separator />

          <div>
            <h3 className="text-sm font-medium flex items-center gap-2 mb-3">
              <History className="h-4 w-4 text-muted-foreground" />
              Recent Transactions
            </h3>

            {recentTransactions.length > 0 ? (
              <div className="space-y-2">
                {recentTransactions.map((tx) => (
                  <Card
                    key={tx.id}
                    className="p-3"
                    data-testid={`card-transaction-${tx.id}`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex items-center gap-1.5">
                        <ChainIcon chain={tx.sourceChain} size={16} />
                        <ArrowRight className="h-3 w-3 text-muted-foreground" />
                        <ChainIcon chain={tx.targetChain} size={16} />
                      </div>
                      {getStatusBadge(tx.status)}
                    </div>

                    <div className="space-y-1 text-xs">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Amount</span>
                        <span className="font-mono">{tx.amount} ZEC</span>
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-muted-foreground">Hash</span>
                        <div className="flex items-center gap-1">
                          <span className="font-mono truncate max-w-[100px]">
                            {tx.hash.slice(0, 8)}...{tx.hash.slice(-6)}
                          </span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-5 w-5"
                            onClick={() => handleCopy(tx.hash, tx.id)}
                            data-testid={`button-copy-hash-${tx.id}`}
                          >
                            {copied === tx.id ? (
                              <CheckCircle2 className="h-3 w-3 text-chart-2" />
                            ) : (
                              <Copy className="h-3 w-3" />
                            )}
                          </Button>
                        </div>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Confirmations</span>
                        <span>{tx.confirmations}/12</span>
                      </div>
                      <div className="flex justify-between text-muted-foreground">
                        <span>Time</span>
                        <span>{format(new Date(tx.timestamp), "MMM d, h:mm a")}</span>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 text-muted-foreground">
                <p className="text-xs">No recent transactions</p>
              </div>
            )}
          </div>
        </div>
      </ScrollArea>

      <BridgeExecutionModal
        quote={activeQuote}
        isOpen={showExecutionModal}
        onClose={() => {
          setShowExecutionModal(false);
          setActiveQuote(null);
        }}
        onSuccess={handleExecutionSuccess}
      />
    </div>
  );
}
