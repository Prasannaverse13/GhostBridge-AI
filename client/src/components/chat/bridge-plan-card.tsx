import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import type { BridgePlan } from "@shared/schema";
import { ChainIcon, getChainName } from "@/components/icons/chain-icons";
import { 
  ArrowRight, 
  Clock, 
  Shield, 
  CheckCircle2, 
  Circle, 
  Loader2,
  AlertCircle,
  Lock
} from "lucide-react";

interface BridgePlanCardProps {
  plan: BridgePlan;
}

export function BridgePlanCard({ plan }: BridgePlanCardProps) {
  const completedSteps = plan.steps.filter(s => s.status === "confirmed").length;
  const progress = (completedSteps / plan.steps.length) * 100;

  const getStepIcon = (status: string) => {
    switch (status) {
      case "confirmed":
        return <CheckCircle2 className="h-4 w-4 text-chart-2" />;
      case "processing":
        return <Loader2 className="h-4 w-4 text-primary animate-spin" />;
      case "failed":
        return <AlertCircle className="h-4 w-4 text-destructive" />;
      default:
        return <Circle className="h-4 w-4 text-muted-foreground" />;
    }
  };

  return (
    <Card className="w-full max-w-md" data-testid={`card-bridge-plan-${plan.id}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <CardTitle className="text-base font-medium flex items-center gap-2">
            Bridge Plan
            {plan.isShielded && (
              <Badge variant="outline" className="gap-1 text-chart-2 border-chart-2/30">
                <Lock className="h-3 w-3" />
                Shielded
              </Badge>
            )}
          </CardTitle>
          <Badge variant="secondary">{plan.protocol}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between gap-4 p-3 rounded-md bg-muted">
          <div className="flex items-center gap-2">
            <ChainIcon chain={plan.sourceChain} size={28} />
            <div className="flex flex-col">
              <span className="text-sm font-medium">{plan.amount} ZEC</span>
              <span className="text-xs text-muted-foreground">
                {getChainName(plan.sourceChain)}
              </span>
            </div>
          </div>
          
          <ArrowRight className="h-5 w-5 text-muted-foreground shrink-0" />
          
          <div className="flex items-center gap-2">
            <ChainIcon chain={plan.targetChain} size={28} />
            <div className="flex flex-col">
              <span className="text-sm font-medium">{plan.amount} wZEC</span>
              <span className="text-xs text-muted-foreground">
                {getChainName(plan.targetChain)}
              </span>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Progress</span>
            <span className="font-medium">{completedSteps}/{plan.steps.length} steps</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        <div className="space-y-2">
          {plan.steps.map((step) => (
            <div
              key={step.step}
              className="flex items-start gap-3 p-2 rounded-md transition-colors"
              data-testid={`step-${step.step}`}
            >
              <div className="mt-0.5">{getStepIcon(step.status)}</div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">{step.title}</p>
                <p className="text-xs text-muted-foreground truncate">
                  {step.description}
                </p>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-3 pt-2 border-t border-border">
          <div className="flex flex-col gap-1">
            <span className="text-xs text-muted-foreground">Estimated Fees</span>
            <div className="space-y-0.5">
              <div className="flex justify-between text-xs">
                <span>Gas:</span>
                <span className="font-mono">{plan.estimatedFees.gas}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span>Bridge:</span>
                <span className="font-mono">{plan.estimatedFees.bridge}</span>
              </div>
              <div className="flex justify-between text-sm font-medium pt-1 border-t border-border">
                <span>Total:</span>
                <span className="font-mono text-primary">
                  {plan.estimatedFees.total}
                  <span className="text-muted-foreground text-xs ml-1">
                    (~{plan.estimatedFees.totalUsd})
                  </span>
                </span>
              </div>
            </div>
          </div>
          
          <div className="flex flex-col gap-1 items-end">
            <span className="text-xs text-muted-foreground">Est. Time</span>
            <div className="flex items-center gap-1 text-sm">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span>{plan.estimatedTime}</span>
            </div>
            {plan.isShielded && (
              <div className="flex items-center gap-1 text-xs text-chart-2 mt-1">
                <Shield className="h-3 w-3" />
                <span>Private Transaction</span>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
