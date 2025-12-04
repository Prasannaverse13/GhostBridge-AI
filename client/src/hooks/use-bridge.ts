import { useMutation, useQuery } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";

export interface BridgeQuote {
  id: string;
  protocol: string;
  sourceChain: string;
  targetChain: string;
  sourceToken: string;
  targetToken: string;
  inputAmount: string;
  outputAmount: string;
  fees: {
    bridgeFee: string;
    gasFee: string;
    protocolFee: string;
    totalFee: string;
    totalFeeUsd: string;
  };
  estimatedTime: number;
  slippageTolerance: number;
  route: {
    step: number;
    protocol: string;
    action: string;
    chain: string;
    description: string;
    estimatedDuration: number;
  }[];
  isShielded: boolean;
  expiresAt: string;
  securityLevel: "standard" | "enhanced" | "maximum";
}

export interface BridgeExecution {
  id: string;
  quoteId: string;
  status: string;
  steps: {
    step: number;
    status: "pending" | "in_progress" | "completed" | "failed";
    transactionHash?: string;
    blockNumber?: number;
    timestamp?: string;
    message: string;
  }[];
  sourceTransaction?: {
    hash: string;
    blockNumber: number;
    confirmations: number;
    explorerUrl: string;
  };
  targetTransaction?: {
    hash: string;
    blockNumber: number;
    confirmations: number;
    explorerUrl: string;
  };
  createdAt: string;
  updatedAt: string;
  error?: string;
}

export interface ProtocolInfo {
  protocol: string;
  config: {
    name: string;
    displayName: string;
    supportedChains: string[];
    avgBridgeTime: number;
    baseFeePercent: number;
    securityLevel: string;
    supportsShielded: boolean;
  };
}

export function useBridgeProtocols() {
  return useQuery<{ protocols: ProtocolInfo[]; chains: string[] }>({
    queryKey: ["/api/bridge/protocols"],
  });
}

export function useBridgeQuote(params: {
  sourceChain: string;
  targetChain: string;
  amount: string;
  isShielded?: boolean;
  preferredProtocol?: string;
}) {
  return useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/bridge/quote", params);
      return response.json() as Promise<{ quote: BridgeQuote }>;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/bridge"] });
    },
  });
}

export function useBridgeQuotes(params: {
  sourceChain: string;
  targetChain: string;
  amount: string;
  isShielded?: boolean;
}) {
  return useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/bridge/quotes", params);
      return response.json() as Promise<{ quotes: BridgeQuote[]; count: number }>;
    },
  });
}

export function useExecuteBridge() {
  return useMutation({
    mutationFn: async (data: { quote: BridgeQuote; signerAddress: string }) => {
      const response = await apiRequest("POST", "/api/bridge/execute", data);
      return response.json() as Promise<{ execution: BridgeExecution }>;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/transactions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/bridge/history"] });
    },
  });
}

export function useBridgeExecution(executionId: string | null) {
  return useQuery<{ execution: BridgeExecution }>({
    queryKey: ["/api/bridge/execution", executionId],
    queryFn: async () => {
      const response = await fetch(`/api/bridge/execution/${executionId}`);
      if (!response.ok) {
        throw new Error("Failed to fetch execution status");
      }
      return response.json();
    },
    enabled: !!executionId,
    refetchInterval: (query) => {
      const execution = query.state.data?.execution;
      if (!execution) return 2000;
      if (execution.status === "completed" || execution.status === "failed") {
        return false;
      }
      return 2000;
    },
  });
}

export function useBridgeHistory(walletAddress: string | undefined, limit: number = 10) {
  return useQuery<{ executions: BridgeExecution[] }>({
    queryKey: ["/api/bridge/history", walletAddress, limit],
    queryFn: async () => {
      const response = await fetch(`/api/bridge/history?wallet=${encodeURIComponent(walletAddress!)}&limit=${limit}`);
      if (!response.ok) {
        throw new Error("Failed to fetch bridge history");
      }
      return response.json();
    },
    enabled: !!walletAddress,
  });
}

export function formatTime(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  if (secs === 0) return `${mins}m`;
  return `${mins}m ${secs}s`;
}

export function getSecurityBadgeColor(level: string): string {
  switch (level) {
    case "maximum":
      return "text-green-400";
    case "enhanced":
      return "text-yellow-400";
    default:
      return "text-muted-foreground";
  }
}
