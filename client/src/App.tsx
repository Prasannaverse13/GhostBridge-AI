import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { WalletProvider } from "@/lib/wallet-context";
import GhostBridge from "@/pages/ghostbridge";

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WalletProvider>
          <div className="flex h-screen w-full bg-background">
            <GhostBridge />
          </div>
          <Toaster />
        </WalletProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
