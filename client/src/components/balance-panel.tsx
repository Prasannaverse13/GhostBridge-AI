import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ChainIcon } from "@/components/icons/chain-icons";
import { useWallet } from "@/lib/wallet-context";
import { 
  RefreshCw, 
  TrendingUp, 
  TrendingDown, 
  Wallet as WalletIcon,
  ArrowUpRight,
  AlertCircle
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ChainBalance {
  chain: string;
  symbol: string;
  balance: string;
  usdValue: string;
  lastUpdated: string;
}

interface BalanceResponse {
  balances: ChainBalance[];
  totalUsdValue: string;
}

interface PriceData {
  usd: number;
  change24h: number;
}

interface PricesResponse {
  prices: Record<string, PriceData>;
  lastUpdated: string;
}

export function BalancePanel() {
  const { wallet } = useWallet();
  
  const balanceUrl = wallet.isConnected && wallet.accountId
    ? `/api/balances?near=${encodeURIComponent(wallet.accountId)}`
    : `/api/balances?demo=true`;
  
  const { 
    data: balanceData, 
    isLoading: balanceLoading, 
    isError: balanceError,
    refetch: refetchBalances 
  } = useQuery<BalanceResponse>({
    queryKey: [balanceUrl],
    refetchInterval: 30000,
  });

  const { data: pricesData } = useQuery<PricesResponse>({
    queryKey: ["/api/prices"],
    refetchInterval: 60000,
  });

  const handleRefresh = () => {
    refetchBalances();
  };

  const getPriceChange = (symbol: string): number | undefined => {
    return pricesData?.prices?.[symbol]?.change24h;
  };

  if (balanceError) {
    return (
      <Card data-testid="card-balance-panel-error">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <WalletIcon className="h-4 w-4 text-primary" />
            Portfolio Balance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-4 text-center">
            <AlertCircle className="h-8 w-8 text-destructive mb-2" />
            <p className="text-sm text-muted-foreground">Failed to load balances</p>
            <Button
              variant="outline"
              size="sm"
              className="mt-3"
              onClick={handleRefresh}
              data-testid="button-retry-balances"
            >
              <RefreshCw className="h-3 w-3 mr-2" />
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (balanceLoading) {
    return (
      <Card data-testid="card-balance-panel">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <WalletIcon className="h-4 w-4 text-primary" />
            Portfolio Balance
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-8 w-32" />
          <div className="space-y-2">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card data-testid="card-balance-panel">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <WalletIcon className="h-4 w-4 text-primary" />
            Portfolio Balance
          </CardTitle>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={handleRefresh}
            data-testid="button-refresh-balances"
          >
            <RefreshCw className="h-3.5 w-3.5" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-center pb-2 border-b border-border">
          <p className="text-xs text-muted-foreground">Total Value</p>
          <p className="text-2xl font-bold text-primary" data-testid="text-total-balance">
            {balanceData?.totalUsdValue || "$0.00"}
          </p>
        </div>

        <div className="space-y-2">
          {balanceData?.balances.map((balance) => {
            const priceChange = getPriceChange(balance.symbol);
            const isPositive = priceChange && priceChange > 0;
            const isNegative = priceChange && priceChange < 0;

            return (
              <div
                key={balance.chain}
                className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover-elevate transition-all"
                data-testid={`balance-row-${balance.chain}`}
              >
                <div className="flex items-center gap-3">
                  <ChainIcon chain={balance.chain as "zcash" | "ethereum" | "near" | "polygon" | "binance" | "avalanche"} size={24} />
                  <div>
                    <p className="font-medium text-sm">{balance.symbol}</p>
                    <p className="text-xs text-muted-foreground capitalize">
                      {balance.chain}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-mono text-sm" data-testid={`text-balance-${balance.chain}`}>
                    {balance.balance}
                  </p>
                  <div className="flex items-center gap-1 justify-end">
                    <p className="text-xs text-muted-foreground">
                      {balance.usdValue}
                    </p>
                    {priceChange !== undefined && (
                      <Badge
                        variant="outline"
                        className={cn(
                          "text-[10px] px-1 py-0",
                          isPositive && "text-chart-2 border-chart-2/30",
                          isNegative && "text-destructive border-destructive/30"
                        )}
                      >
                        {isPositive ? (
                          <TrendingUp className="h-2 w-2 mr-0.5" />
                        ) : isNegative ? (
                          <TrendingDown className="h-2 w-2 mr-0.5" />
                        ) : null}
                        {Math.abs(priceChange).toFixed(1)}%
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="pt-2 border-t border-border">
          <Button
            variant="outline"
            size="sm"
            className="w-full gap-2"
            data-testid="button-view-all-assets"
          >
            View All Assets
            <ArrowUpRight className="h-3 w-3" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
