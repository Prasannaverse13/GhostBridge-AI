import { randomUUID } from "crypto";
import { storage, type BridgeExecutionRecord } from "./storage";

export interface BridgeQuote {
  id: string;
  protocol: BridgeProtocol;
  sourceChain: Chain;
  targetChain: Chain;
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
  route: BridgeRoute[];
  isShielded: boolean;
  expiresAt: string;
  securityLevel: "standard" | "enhanced" | "maximum";
}

export interface BridgeRoute {
  step: number;
  protocol: string;
  action: "lock" | "mint" | "burn" | "unlock" | "swap" | "verify";
  chain: Chain;
  description: string;
  estimatedDuration: number;
}

export interface BridgeExecution {
  id: string;
  quoteId: string;
  status: BridgeExecutionStatus;
  steps: ExecutionStep[];
  sourceTransaction?: TransactionInfo;
  targetTransaction?: TransactionInfo;
  createdAt: string;
  updatedAt: string;
  error?: string;
}

export interface ExecutionStep {
  step: number;
  status: "pending" | "in_progress" | "completed" | "failed";
  transactionHash?: string;
  blockNumber?: number;
  timestamp?: string;
  message: string;
}

export interface TransactionInfo {
  hash: string;
  blockNumber: number;
  confirmations: number;
  explorerUrl: string;
}

type Chain = "zcash" | "ethereum" | "near" | "polygon" | "binance" | "avalanche" | "starknet" | "mina";
type BridgeProtocol = "wormhole" | "near_intents" | "polygon_bridge" | "multichain" | "avalanche_bridge" | "starknet_bridge" | "mina_bridge";
type BridgeExecutionStatus = "pending" | "source_confirmed" | "bridging" | "target_pending" | "completed" | "failed";

interface ProtocolConfig {
  name: string;
  displayName: string;
  supportedSourceChains: Chain[];
  supportedTargetChains: Chain[];
  avgBridgeTime: number;
  baseFeePercent: number;
  securityLevel: "standard" | "enhanced" | "maximum";
  supportsShielded: boolean;
}

const PROTOCOL_CONFIGS: Record<BridgeProtocol, ProtocolConfig> = {
  wormhole: {
    name: "wormhole",
    displayName: "Wormhole",
    supportedSourceChains: ["zcash", "ethereum"],
    supportedTargetChains: ["ethereum", "polygon", "binance", "avalanche"],
    avgBridgeTime: 900,
    baseFeePercent: 0.1,
    securityLevel: "maximum",
    supportsShielded: true,
  },
  near_intents: {
    name: "near_intents",
    displayName: "NEAR Intents",
    supportedSourceChains: ["zcash", "near", "ethereum"],
    supportedTargetChains: ["near", "ethereum"],
    avgBridgeTime: 180,
    baseFeePercent: 0.05,
    securityLevel: "enhanced",
    supportsShielded: true,
  },
  polygon_bridge: {
    name: "polygon_bridge",
    displayName: "Polygon Bridge",
    supportedSourceChains: ["zcash", "ethereum", "polygon"],
    supportedTargetChains: ["polygon", "ethereum"],
    avgBridgeTime: 600,
    baseFeePercent: 0.08,
    securityLevel: "standard",
    supportsShielded: false,
  },
  multichain: {
    name: "multichain",
    displayName: "Multichain",
    supportedSourceChains: ["zcash", "binance", "ethereum", "polygon", "avalanche"],
    supportedTargetChains: ["binance", "ethereum", "polygon", "avalanche"],
    avgBridgeTime: 720,
    baseFeePercent: 0.15,
    securityLevel: "standard",
    supportsShielded: false,
  },
  avalanche_bridge: {
    name: "avalanche_bridge",
    displayName: "Avalanche Bridge",
    supportedSourceChains: ["zcash", "ethereum", "avalanche"],
    supportedTargetChains: ["avalanche", "ethereum"],
    avgBridgeTime: 480,
    baseFeePercent: 0.1,
    securityLevel: "enhanced",
    supportsShielded: false,
  },
  starknet_bridge: {
    name: "starknet_bridge",
    displayName: "Starknet Bridge",
    supportedSourceChains: ["zcash", "ethereum", "starknet"],
    supportedTargetChains: ["starknet", "ethereum"],
    avgBridgeTime: 360,
    baseFeePercent: 0.08,
    securityLevel: "maximum",
    supportsShielded: true,
  },
  mina_bridge: {
    name: "mina_bridge",
    displayName: "Mina Bridge",
    supportedSourceChains: ["zcash", "ethereum", "mina"],
    supportedTargetChains: ["mina", "ethereum"],
    avgBridgeTime: 420,
    baseFeePercent: 0.07,
    securityLevel: "maximum",
    supportsShielded: true,
  },
};

const CHAIN_GAS_PRICES: Record<Chain, number> = {
  zcash: 0.0001,
  ethereum: 0.005,
  near: 0.001,
  polygon: 0.0005,
  binance: 0.001,
  avalanche: 0.002,
  starknet: 0.0003,
  mina: 0.0004,
};

const TOKEN_PRICES_USD: Record<string, number> = {
  ZEC: 35.0,
  ETH: 3500.0,
  NEAR: 5.5,
  MATIC: 0.85,
  BNB: 580.0,
  AVAX: 35.0,
  STRK: 0.45,
  MINA: 0.65,
  wZEC: 35.0,
  USDC: 1.0,
};

export class BridgeService {
  private activeExecutions: Map<string, BridgeExecution> = new Map();

  selectBestProtocol(sourceChain: Chain, targetChain: Chain, isShielded: boolean): BridgeProtocol | null {
    const candidates: { protocol: BridgeProtocol; score: number }[] = [];

    for (const [protocol, config] of Object.entries(PROTOCOL_CONFIGS)) {
      if (!config.supportedSourceChains.includes(sourceChain)) continue;
      if (!config.supportedTargetChains.includes(targetChain)) continue;
      if (isShielded && !config.supportsShielded) continue;

      let score = 100;

      score -= config.baseFeePercent * 100;
      score -= config.avgBridgeTime / 60;

      if (config.securityLevel === "maximum") score += 20;
      else if (config.securityLevel === "enhanced") score += 10;

      if (isShielded && config.supportsShielded) score += 15;

      candidates.push({ protocol: protocol as BridgeProtocol, score });
    }

    if (candidates.length === 0) {
      return null;
    }

    candidates.sort((a, b) => b.score - a.score);
    return candidates[0].protocol;
  }

  isChainPairSupported(sourceChain: Chain, targetChain: Chain): boolean {
    for (const config of Object.values(PROTOCOL_CONFIGS)) {
      if (config.supportedSourceChains.includes(sourceChain) && 
          config.supportedTargetChains.includes(targetChain)) {
        return true;
      }
    }
    return false;
  }

  getSupportedPairsForChain(chain: Chain): { sources: Chain[]; targets: Chain[] } {
    const sources: Set<Chain> = new Set();
    const targets: Set<Chain> = new Set();
    
    for (const config of Object.values(PROTOCOL_CONFIGS)) {
      if (config.supportedTargetChains.includes(chain)) {
        config.supportedSourceChains.forEach(c => sources.add(c));
      }
      if (config.supportedSourceChains.includes(chain)) {
        config.supportedTargetChains.forEach(c => targets.add(c));
      }
    }
    
    return { sources: Array.from(sources), targets: Array.from(targets) };
  }

  async getQuote(params: {
    sourceChain: Chain;
    targetChain: Chain;
    amount: string;
    isShielded?: boolean;
    preferredProtocol?: BridgeProtocol;
    slippageTolerance?: number;
  }): Promise<BridgeQuote> {
    const {
      sourceChain,
      targetChain,
      amount,
      isShielded = true,
      preferredProtocol,
      slippageTolerance = 0.5,
    } = params;

    if (!this.isChainPairSupported(sourceChain, targetChain)) {
      const supportedTargets = this.getSupportedPairsForChain(sourceChain);
      throw new Error(
        `Bridging from ${sourceChain} to ${targetChain} is not currently supported. ` +
        `Supported targets from ${sourceChain}: ${supportedTargets.targets.join(", ") || "none"}`
      );
    }

    if (preferredProtocol) {
      const preferredConfig = PROTOCOL_CONFIGS[preferredProtocol];
      if (!preferredConfig.supportedSourceChains.includes(sourceChain)) {
        throw new Error(
          `Protocol ${preferredConfig.displayName} does not support ${sourceChain} as source chain. ` +
          `Supported sources: ${preferredConfig.supportedSourceChains.join(", ")}`
        );
      }
      if (!preferredConfig.supportedTargetChains.includes(targetChain)) {
        throw new Error(
          `Protocol ${preferredConfig.displayName} does not support ${targetChain} as target chain. ` +
          `Supported targets: ${preferredConfig.supportedTargetChains.join(", ")}`
        );
      }
      if (isShielded && !preferredConfig.supportsShielded) {
        throw new Error(
          `Protocol ${preferredConfig.displayName} does not support shielded transactions. ` +
          `Please disable shielded mode or choose a different protocol.`
        );
      }
    }

    const protocol = preferredProtocol || this.selectBestProtocol(sourceChain, targetChain, isShielded);
    if (!protocol) {
      throw new Error(
        `No compatible bridge protocol found for ${sourceChain} to ${targetChain}` +
        (isShielded ? " with shielded transactions" : "")
      );
    }
    const config = PROTOCOL_CONFIGS[protocol];

    const inputAmount = parseFloat(amount);

    const bridgeFee = inputAmount * (config.baseFeePercent / 100);
    const sourceGasFee = CHAIN_GAS_PRICES[sourceChain];
    const targetGasFee = CHAIN_GAS_PRICES[targetChain];
    const protocolFee = inputAmount * 0.001;

    const totalFee = bridgeFee + sourceGasFee + targetGasFee + protocolFee;
    const outputAmount = inputAmount - bridgeFee - protocolFee;

    const totalFeeUsd = totalFee * TOKEN_PRICES_USD.ZEC;

    const route = this.generateRoute(sourceChain, targetChain, protocol, isShielded);

    const quote: BridgeQuote = {
      id: randomUUID(),
      protocol,
      sourceChain,
      targetChain,
      sourceToken: "ZEC",
      targetToken: `wZEC`,
      inputAmount: amount,
      outputAmount: outputAmount.toFixed(8),
      fees: {
        bridgeFee: bridgeFee.toFixed(8) + " ZEC",
        gasFee: (sourceGasFee + targetGasFee).toFixed(8) + " ZEC",
        protocolFee: protocolFee.toFixed(8) + " ZEC",
        totalFee: totalFee.toFixed(8) + " ZEC",
        totalFeeUsd: `$${totalFeeUsd.toFixed(2)}`,
      },
      estimatedTime: config.avgBridgeTime,
      slippageTolerance,
      route,
      isShielded,
      expiresAt: new Date(Date.now() + 300000).toISOString(),
      securityLevel: config.securityLevel,
    };

    return quote;
  }

  async getMultipleQuotes(params: {
    sourceChain: Chain;
    targetChain: Chain;
    amount: string;
    isShielded?: boolean;
  }): Promise<BridgeQuote[]> {
    const { sourceChain, targetChain, amount, isShielded = true } = params;
    const quotes: BridgeQuote[] = [];

    for (const protocol of Object.keys(PROTOCOL_CONFIGS) as BridgeProtocol[]) {
      const config = PROTOCOL_CONFIGS[protocol];

      if (!config.supportedSourceChains.includes(sourceChain)) continue;
      if (!config.supportedTargetChains.includes(targetChain)) continue;
      if (isShielded && !config.supportsShielded) continue;

      try {
        const quote = await this.getQuote({
          sourceChain,
          targetChain,
          amount,
          isShielded,
          preferredProtocol: protocol,
        });
        quotes.push(quote);
      } catch (error) {
        console.error(`Failed to get quote from ${protocol}:`, error);
      }
    }

    quotes.sort((a, b) => parseFloat(a.fees.totalFee) - parseFloat(b.fees.totalFee));
    return quotes;
  }

  private generateRoute(
    sourceChain: Chain,
    targetChain: Chain,
    protocol: BridgeProtocol,
    isShielded: boolean
  ): BridgeRoute[] {
    const config = PROTOCOL_CONFIGS[protocol];
    const route: BridgeRoute[] = [];
    let stepNum = 1;

    if (isShielded && sourceChain === "zcash") {
      route.push({
        step: stepNum++,
        protocol: "Zcash",
        action: "verify",
        chain: sourceChain,
        description: "Prepare shielded transaction with Sapling proof",
        estimatedDuration: 30,
      });
    }

    route.push({
      step: stepNum++,
      protocol: config.displayName,
      action: "lock",
      chain: sourceChain,
      description: `Lock ZEC in ${config.displayName} bridge contract`,
      estimatedDuration: 60,
    });

    if (protocol === "wormhole") {
      route.push({
        step: stepNum++,
        protocol: "Wormhole Guardians",
        action: "verify",
        chain: sourceChain,
        description: "Guardian network validates and signs VAA",
        estimatedDuration: config.avgBridgeTime * 0.6,
      });
    } else if (protocol === "near_intents") {
      route.push({
        step: stepNum++,
        protocol: "NEAR Intents",
        action: "verify",
        chain: "near",
        description: "Intent solver network processes cross-chain intent",
        estimatedDuration: config.avgBridgeTime * 0.5,
      });
    }

    route.push({
      step: stepNum++,
      protocol: config.displayName,
      action: "mint",
      chain: targetChain,
      description: `Mint wZEC on ${this.formatChainName(targetChain)}`,
      estimatedDuration: config.avgBridgeTime * 0.3,
    });

    return route;
  }

  async executeQuote(quote: BridgeQuote, signerAddress: string): Promise<BridgeExecution> {
    if (new Date(quote.expiresAt) < new Date()) {
      throw new Error("Quote has expired. Please request a new quote.");
    }

    const execution: BridgeExecution = {
      id: randomUUID(),
      quoteId: quote.id,
      status: "pending",
      steps: quote.route.map((r) => ({
        step: r.step,
        status: "pending",
        message: r.description,
      })),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.activeExecutions.set(execution.id, execution);

    const executionRecord: BridgeExecutionRecord = {
      ...execution,
      walletAddress: signerAddress,
      sourceChain: quote.sourceChain,
      targetChain: quote.targetChain,
      inputAmount: quote.inputAmount,
      outputAmount: quote.outputAmount,
      protocol: quote.protocol,
    };
    await storage.saveBridgeExecution(executionRecord);

    this.simulateExecution(execution, quote, signerAddress);

    return execution;
  }

  private async simulateExecution(
    execution: BridgeExecution,
    quote: BridgeQuote,
    _signerAddress: string
  ): Promise<void> {
    for (let i = 0; i < execution.steps.length; i++) {
      await this.delay(2000);

      execution.steps[i].status = "in_progress";
      execution.updatedAt = new Date().toISOString();
      
      await storage.updateBridgeExecution(execution.id, {
        steps: execution.steps,
        status: execution.status,
      });

      await this.delay(quote.route[i].estimatedDuration * 10);

      const success = Math.random() > 0.05;

      if (success) {
        execution.steps[i].status = "completed";
        execution.steps[i].transactionHash = `0x${this.generateRandomHex(64)}`;
        execution.steps[i].blockNumber = Math.floor(Math.random() * 1000000) + 18000000;
        execution.steps[i].timestamp = new Date().toISOString();

        const txHash = execution.steps[i].transactionHash!;
        const blockNum = execution.steps[i].blockNumber!;

        if (i === 0) {
          execution.sourceTransaction = {
            hash: txHash,
            blockNumber: blockNum,
            confirmations: 1,
            explorerUrl: this.getExplorerUrl(quote.sourceChain, txHash),
          };
          execution.status = "source_confirmed";
        } else if (i === execution.steps.length - 2) {
          execution.status = "bridging";
        } else if (i === execution.steps.length - 1) {
          execution.targetTransaction = {
            hash: `0x${this.generateRandomHex(64)}`,
            blockNumber: Math.floor(Math.random() * 1000000) + 18000000,
            confirmations: 1,
            explorerUrl: this.getExplorerUrl(quote.targetChain, txHash),
          };
          execution.status = "completed";
        }
      } else {
        execution.steps[i].status = "failed";
        execution.status = "failed";
        execution.error = "Transaction failed. Please try again.";
        
        await storage.updateBridgeExecution(execution.id, {
          steps: execution.steps,
          status: execution.status,
          error: execution.error,
          sourceTransaction: execution.sourceTransaction,
          targetTransaction: execution.targetTransaction,
        });
        break;
      }

      execution.updatedAt = new Date().toISOString();
      
      await storage.updateBridgeExecution(execution.id, {
        steps: execution.steps,
        status: execution.status,
        sourceTransaction: execution.sourceTransaction,
        targetTransaction: execution.targetTransaction,
      });
    }
  }

  getExecutionStatus(executionId: string): BridgeExecution | null {
    return this.activeExecutions.get(executionId) || null;
  }

  getSupportedProtocols(): { protocol: BridgeProtocol; config: ProtocolConfig }[] {
    return Object.entries(PROTOCOL_CONFIGS).map(([protocol, config]) => ({
      protocol: protocol as BridgeProtocol,
      config,
    }));
  }

  getSupportedChains(): Chain[] {
    return ["zcash", "ethereum", "near", "polygon", "binance", "avalanche", "starknet", "mina"];
  }

  private formatChainName(chain: Chain): string {
    const names: Record<Chain, string> = {
      zcash: "Zcash",
      ethereum: "Ethereum",
      near: "NEAR",
      polygon: "Polygon",
      binance: "BNB Chain",
      avalanche: "Avalanche",
      starknet: "Starknet",
      mina: "Mina",
    };
    return names[chain];
  }

  private getExplorerUrl(chain: Chain, txHash: string): string {
    const explorers: Record<Chain, string> = {
      zcash: "https://explorer.zcha.in/transactions/",
      ethereum: "https://etherscan.io/tx/",
      near: "https://nearblocks.io/txns/",
      polygon: "https://polygonscan.com/tx/",
      binance: "https://bscscan.com/tx/",
      avalanche: "https://snowtrace.io/tx/",
      starknet: "https://starkscan.co/tx/",
      mina: "https://minaexplorer.com/transaction/",
    };
    return explorers[chain] + txHash;
  }

  private generateRandomHex(length: number): string {
    const chars = "0123456789abcdef";
    let result = "";
    for (let i = 0; i < length; i++) {
      result += chars[Math.floor(Math.random() * chars.length)];
    }
    return result;
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

export const bridgeService = new BridgeService();
