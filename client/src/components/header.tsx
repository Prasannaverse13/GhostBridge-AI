import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useWallet } from "@/lib/wallet-context";
import { 
  Wallet, 
  LogOut, 
  Copy, 
  Check, 
  Shield, 
  ChevronDown,
  Loader2,
  Zap
} from "lucide-react";

export function Header() {
  const { wallet, connect, disconnect, isConnecting } = useWallet();
  const [copied, setCopied] = useState(false);

  const handleCopyAddress = async () => {
    if (wallet.accountId) {
      await navigator.clipboard.writeText(wallet.accountId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleConnect = async () => {
    await connect();
  };

  const truncateAddress = (address: string) => {
    if (address.length <= 16) return address;
    return `${address.slice(0, 8)}...${address.slice(-6)}`;
  };

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <div className="flex h-16 items-center justify-between gap-4 px-4 md:px-6">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="relative flex h-9 w-9 items-center justify-center rounded-md bg-primary">
                <Shield className="h-5 w-5 text-primary-foreground" />
                <div className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full border-2 border-background bg-chart-2" />
              </div>
              <div className="flex flex-col">
                <span className="text-lg font-semibold tracking-tight" data-testid="text-app-name">
                  GhostBridge
                </span>
                <span className="text-xs text-muted-foreground hidden sm:block">
                  AI-Powered Privacy Bridge
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Badge variant="outline" className="hidden sm:flex items-center gap-1.5">
              <Zap className="h-3 w-3 text-primary" />
              <span className="text-xs">{wallet.network === "testnet" ? "Testnet" : "Mainnet"}</span>
            </Badge>

            {wallet.isConnected ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="gap-2" data-testid="button-wallet-dropdown">
                    <Wallet className="h-4 w-4" />
                    <span className="hidden sm:inline font-mono text-sm">
                      {truncateAddress(wallet.accountId || "")}
                    </span>
                    <span className="sm:hidden font-mono text-sm">
                      {wallet.accountId?.slice(0, 6)}...
                    </span>
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-64">
                  <div className="p-3">
                    <p className="text-xs text-muted-foreground mb-1">Connected Account</p>
                    <p className="font-mono text-sm break-all">{wallet.accountId}</p>
                    {wallet.balance && (
                      <p className="mt-2 text-sm">
                        <span className="text-muted-foreground">Balance: </span>
                        <span className="font-semibold">{wallet.balance} NEAR</span>
                      </p>
                    )}
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleCopyAddress} data-testid="button-copy-address">
                    {copied ? (
                      <Check className="h-4 w-4 mr-2 text-chart-2" />
                    ) : (
                      <Copy className="h-4 w-4 mr-2" />
                    )}
                    {copied ? "Copied!" : "Copy Address"}
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={disconnect} 
                    className="text-destructive focus:text-destructive"
                    data-testid="button-disconnect"
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    Disconnect
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button 
                onClick={handleConnect} 
                disabled={isConnecting}
                data-testid="button-connect-wallet"
              >
                {isConnecting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="hidden sm:inline">Connecting...</span>
                  </>
                ) : (
                  <>
                    <Wallet className="h-4 w-4" />
                    <span className="hidden sm:inline">Connect Wallet</span>
                    <span className="sm:hidden">Connect</span>
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </header>
    </>
  );
}
