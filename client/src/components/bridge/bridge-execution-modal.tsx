import { useState, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogPortal,
  DialogOverlay,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Shield, 
  ArrowRight, 
  Clock, 
  Wallet,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Lock,
} from "lucide-react";
import { useWallet, type TransactionAction } from "@/lib/wallet-context";
import { useExecuteBridge, type BridgeQuote, type BridgeExecution } from "@/hooks/use-bridge";
import { BridgeExecutionTracker } from "./bridge-execution-tracker";
import { formatTime } from "@/hooks/use-bridge";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface BridgeExecutionModalProps {
  quote: BridgeQuote | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (execution: BridgeExecution) => void;
}

const CHAIN_COLORS: Record<string, string> = {
  zcash: "text-amber-400",
  ethereum: "text-blue-400",
  near: "text-cyan-400",
  polygon: "text-purple-400",
  binance: "text-yellow-400",
  avalanche: "text-red-400",
};

const BRIDGE_CONTRACT_ID = "ghostbridge.testnet";

export function BridgeExecutionModal({ 
  quote, 
  isOpen, 
  onClose, 
  onSuccess 
}: BridgeExecutionModalProps) {
  const { wallet, signTransaction, signMessage, isConnecting } = useWallet();
  const executeBridge = useExecuteBridge();
  const { toast } = useToast();
  
  const [step, setStep] = useState<"confirm" | "signing" | "executing" | "tracking">("confirm");
  const [executionId, setExecutionId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const resetState = useCallback(() => {
    setStep("confirm");
    setExecutionId(null);
    setError(null);
  }, []);

  const handleClose = useCallback(() => {
    if (step === "signing" || step === "executing") {
      return;
    }
    resetState();
    onClose();
  }, [step, resetState, onClose]);

  const handleExecute = useCallback(async () => {
    if (!quote || !wallet.accountId) {
      setError("Wallet not connected");
      return;
    }

    setError(null);
    setStep("signing");

    try {
      const signResult = await signMessage(
        `GhostBridge Authorization\n\nBridge ${quote.inputAmount} ${quote.sourceToken} from ${quote.sourceChain} to ${quote.targetChain}\n\nQuote ID: ${quote.id}\nTimestamp: ${new Date().toISOString()}`
      );

      if (!signResult && quote.sourceChain === "near") {
        toast({
          title: "Signature Required",
          description: "Please approve the message signature in your wallet to proceed.",
          variant: "destructive",
        });
        setStep("confirm");
        return;
      }

      setStep("executing");

      const result = await executeBridge.mutateAsync({
        quote,
        signerAddress: wallet.accountId,
      });

      if (result.execution) {
        setExecutionId(result.execution.id);
        setStep("tracking");
        
        toast({
          title: "Bridge Initiated",
          description: "Your bridge transaction is now being processed.",
        });
      }
    } catch (err) {
      console.error("Bridge execution error:", err);
      setError(err instanceof Error ? err.message : "Failed to execute bridge");
      setStep("confirm");
      
      toast({
        title: "Execution Failed",
        description: err instanceof Error ? err.message : "Failed to execute bridge",
        variant: "destructive",
      });
    }
  }, [quote, wallet.accountId, signMessage, executeBridge, toast]);

  const handleExecutionComplete = useCallback((execution: BridgeExecution) => {
    onSuccess?.(execution);
  }, [onSuccess]);

  const handleExecutionError = useCallback((errorMessage: string) => {
    setError(errorMessage);
  }, []);

  if (!quote) return null;

  const isNearSource = quote.sourceChain === "near";
  const requiresWalletSign = isNearSource && wallet.isConnected;

  const isProcessing = step === "signing" || step === "executing";

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && !isProcessing && handleClose()}>
      <DialogContent 
        className="sm:max-w-lg" 
        data-testid="modal-bridge-execution"
        onInteractOutside={(e) => isProcessing && e.preventDefault()}
        onEscapeKeyDown={(e) => isProcessing && e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            {step === "tracking" ? "Bridge Progress" : "Confirm Bridge"}
          </DialogTitle>
          <DialogDescription>
            {step === "tracking" 
              ? "Your bridge transaction is being processed"
              : "Review the details and confirm your bridge transaction"
            }
          </DialogDescription>
        </DialogHeader>

        {step === "tracking" ? (
          <BridgeExecutionTracker 
            executionId={executionId}
            onComplete={handleExecutionComplete}
            onError={handleExecutionError}
            onClose={handleClose}
          />
        ) : (
          <div className="space-y-6 py-4">
            <div className="flex items-center justify-center gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold">{quote.inputAmount}</p>
                <p className={cn("text-sm font-medium", CHAIN_COLORS[quote.sourceChain])}>
                  {quote.sourceToken}
                </p>
                <Badge variant="outline" className="mt-1 text-xs">
                  {quote.sourceChain}
                </Badge>
              </div>
              
              <ArrowRight className="h-6 w-6 text-muted-foreground" />
              
              <div className="text-center">
                <p className="text-2xl font-bold">{quote.outputAmount}</p>
                <p className={cn("text-sm font-medium", CHAIN_COLORS[quote.targetChain])}>
                  {quote.targetToken}
                </p>
                <Badge variant="outline" className="mt-1 text-xs">
                  {quote.targetChain}
                </Badge>
              </div>
            </div>

            <Separator />

            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Protocol</span>
                <Badge variant="secondary">{quote.protocol}</Badge>
              </div>
              
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Total Fees</span>
                <span className="font-medium">{quote.fees.totalFee} ({quote.fees.totalFeeUsd})</span>
              </div>
              
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Estimated Time</span>
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">{formatTime(quote.estimatedTime)}</span>
                </div>
              </div>
              
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Slippage Tolerance</span>
                <span className="font-medium">{quote.slippageTolerance}%</span>
              </div>
              
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Security Level</span>
                <Badge 
                  variant="outline" 
                  className={cn(
                    quote.securityLevel === "maximum" && "border-green-500/50 text-green-400",
                    quote.securityLevel === "enhanced" && "border-primary/50 text-primary",
                  )}
                >
                  <Lock className="h-3 w-3 mr-1" />
                  {quote.securityLevel}
                </Badge>
              </div>
              
              {quote.isShielded && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Privacy</span>
                  <Badge variant="default" className="bg-green-500/20 text-green-400 border-green-500/30">
                    <Shield className="h-3 w-3 mr-1" />
                    Shielded
                  </Badge>
                </div>
              )}
            </div>

            {error && (
              <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-destructive" />
                  <p className="text-sm text-destructive">{error}</p>
                </div>
              </div>
            )}

            <Separator />

            <div className="flex flex-col gap-3">
              {!wallet.isConnected ? (
                <div className="p-3 rounded-lg bg-muted/30 text-center">
                  <Wallet className="h-5 w-5 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    Connect your wallet to execute this bridge
                  </p>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Signing with</span>
                    <Badge variant="outline">
                      <Wallet className="h-3 w-3 mr-1" />
                      {wallet.accountId}
                    </Badge>
                  </div>
                  
                  <Button 
                    onClick={handleExecute}
                    disabled={step === "signing" || step === "executing" || executeBridge.isPending}
                    className="w-full"
                    data-testid="button-confirm-bridge"
                  >
                    {step === "signing" ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Awaiting Signature...
                      </>
                    ) : step === "executing" ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Executing Bridge...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="h-4 w-4 mr-2" />
                        Confirm Bridge
                      </>
                    )}
                  </Button>
                </>
              )}
              
              <Button 
                variant="ghost" 
                onClick={handleClose}
                disabled={step === "signing" || step === "executing"}
                data-testid="button-cancel-bridge"
              >
                Cancel
              </Button>
            </div>

            <p className="text-xs text-center text-muted-foreground">
              By confirming, you agree to the bridge terms and understand that cryptocurrency 
              transactions are irreversible.
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
