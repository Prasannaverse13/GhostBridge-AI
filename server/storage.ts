import type { ChatMessage, BridgePlan } from "@shared/schema";
import { randomUUID } from "crypto";

export interface BridgeExecutionRecord {
  id: string;
  quoteId: string;
  walletAddress: string;
  sourceChain: string;
  targetChain: string;
  inputAmount: string;
  outputAmount: string;
  protocol: string;
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

export interface IStorage {
  getChatMessages(sessionId: string): Promise<ChatMessage[]>;
  addChatMessage(sessionId: string, message: Omit<ChatMessage, "id" | "timestamp">): Promise<ChatMessage>;
  clearChatMessages(sessionId: string): Promise<void>;
  getActiveBridgePlan(sessionId: string): Promise<BridgePlan | undefined>;
  setActiveBridgePlan(sessionId: string, plan: BridgePlan): Promise<void>;
  clearActiveBridgePlan(sessionId: string): Promise<void>;
  
  saveBridgeExecution(execution: BridgeExecutionRecord): Promise<void>;
  getBridgeExecution(executionId: string): Promise<BridgeExecutionRecord | undefined>;
  updateBridgeExecution(executionId: string, updates: Partial<BridgeExecutionRecord>): Promise<void>;
  getBridgeExecutionsByWallet(walletAddress: string, limit?: number): Promise<BridgeExecutionRecord[]>;
}

export class MemStorage implements IStorage {
  private chatMessages: Map<string, ChatMessage[]>;
  private bridgePlans: Map<string, BridgePlan>;
  private bridgeExecutions: Map<string, BridgeExecutionRecord>;

  constructor() {
    this.chatMessages = new Map();
    this.bridgePlans = new Map();
    this.bridgeExecutions = new Map();
  }

  async getChatMessages(sessionId: string): Promise<ChatMessage[]> {
    return this.chatMessages.get(sessionId) || [];
  }

  async addChatMessage(
    sessionId: string, 
    message: Omit<ChatMessage, "id" | "timestamp">
  ): Promise<ChatMessage> {
    const fullMessage: ChatMessage = {
      ...message,
      id: randomUUID(),
      timestamp: new Date().toISOString(),
    };

    const messages = this.chatMessages.get(sessionId) || [];
    messages.push(fullMessage);
    this.chatMessages.set(sessionId, messages);

    return fullMessage;
  }

  async clearChatMessages(sessionId: string): Promise<void> {
    this.chatMessages.delete(sessionId);
  }

  async getActiveBridgePlan(sessionId: string): Promise<BridgePlan | undefined> {
    return this.bridgePlans.get(sessionId);
  }

  async setActiveBridgePlan(sessionId: string, plan: BridgePlan): Promise<void> {
    this.bridgePlans.set(sessionId, plan);
  }

  async clearActiveBridgePlan(sessionId: string): Promise<void> {
    this.bridgePlans.delete(sessionId);
  }

  async saveBridgeExecution(execution: BridgeExecutionRecord): Promise<void> {
    this.bridgeExecutions.set(execution.id, execution);
  }

  async getBridgeExecution(executionId: string): Promise<BridgeExecutionRecord | undefined> {
    return this.bridgeExecutions.get(executionId);
  }

  async updateBridgeExecution(executionId: string, updates: Partial<BridgeExecutionRecord>): Promise<void> {
    const existing = this.bridgeExecutions.get(executionId);
    if (existing) {
      this.bridgeExecutions.set(executionId, {
        ...existing,
        ...updates,
        updatedAt: new Date().toISOString(),
      });
    }
  }

  async getBridgeExecutionsByWallet(walletAddress: string, limit: number = 10): Promise<BridgeExecutionRecord[]> {
    const executions = Array.from(this.bridgeExecutions.values())
      .filter(e => e.walletAddress === walletAddress)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, limit);
    return executions;
  }
}

export const storage = new MemStorage();
