import { z } from "zod";

export const messageRoleSchema = z.enum(["user", "assistant"]);
export type MessageRole = z.infer<typeof messageRoleSchema>;

export const bridgeStatusSchema = z.enum(["pending", "processing", "confirmed", "failed"]);
export type BridgeStatus = z.infer<typeof bridgeStatusSchema>;

export const chainSchema = z.enum(["zcash", "ethereum", "near", "binance", "polygon", "avalanche", "starknet", "mina"]);
export type Chain = z.infer<typeof chainSchema>;

export const workflowSchema = z.enum([
  "ghostbridge",
  "shadowtrader",
  "enigma",
  "vault",
  "shieldcoder",
  "privamuse",
  "echoprivacy",
  "anonpay",
  "zinsight"
]);
export type Workflow = z.infer<typeof workflowSchema>;

export const bridgePlanSchema = z.object({
  id: z.string(),
  sourceChain: chainSchema,
  targetChain: chainSchema,
  amount: z.string(),
  protocol: z.string(),
  estimatedFees: z.object({
    gas: z.string(),
    bridge: z.string(),
    total: z.string(),
    totalUsd: z.string(),
  }),
  steps: z.array(z.object({
    step: z.number(),
    title: z.string(),
    description: z.string(),
    status: bridgeStatusSchema,
  })),
  isShielded: z.boolean(),
  estimatedTime: z.string(),
});
export type BridgePlan = z.infer<typeof bridgePlanSchema>;

export const chatMessageSchema = z.object({
  id: z.string(),
  role: messageRoleSchema,
  content: z.string(),
  timestamp: z.string(),
  bridgePlan: bridgePlanSchema.optional(),
  workflow: workflowSchema.optional(),
});
export type ChatMessage = z.infer<typeof chatMessageSchema>;

export const insertChatMessageSchema = chatMessageSchema.omit({ id: true, timestamp: true });
export type InsertChatMessage = z.infer<typeof insertChatMessageSchema>;

export const walletStateSchema = z.object({
  isConnected: z.boolean(),
  accountId: z.string().optional(),
  balance: z.string().optional(),
  network: z.enum(["testnet", "mainnet"]),
});
export type WalletState = z.infer<typeof walletStateSchema>;

export const transactionSchema = z.object({
  id: z.string(),
  hash: z.string(),
  sourceChain: chainSchema,
  targetChain: chainSchema,
  amount: z.string(),
  status: bridgeStatusSchema,
  timestamp: z.string(),
  confirmations: z.number(),
});
export type Transaction = z.infer<typeof transactionSchema>;

export const chatRequestSchema = z.object({
  message: z.string().min(1, "Message is required"),
  workflow: workflowSchema.optional(),
  conversationHistory: z.array(z.object({
    role: messageRoleSchema,
    content: z.string(),
  })).optional(),
});
export type ChatRequest = z.infer<typeof chatRequestSchema>;

export const functionCallSchema = z.object({
  name: z.string(),
  args: z.record(z.unknown()),
});
export type FunctionCall = z.infer<typeof functionCallSchema>;

export const chatResponseSchema = z.object({
  message: chatMessageSchema,
  bridgePlan: bridgePlanSchema.optional(),
  functionCall: functionCallSchema.optional(),
});
export type ChatResponse = z.infer<typeof chatResponseSchema>;

export const tradeOrderSchema = z.object({
  id: z.string(),
  type: z.enum(["buy", "sell", "swap"]),
  fromToken: z.string(),
  toToken: z.string(),
  amount: z.string(),
  price: z.string().optional(),
  status: z.enum(["pending", "executing", "completed", "failed"]),
  isPrivate: z.boolean(),
  timestamp: z.string(),
});
export type TradeOrder = z.infer<typeof tradeOrderSchema>;

export const encryptedDataSchema = z.object({
  id: z.string(),
  encryptedPayload: z.string(),
  publicKey: z.string(),
  timestamp: z.string(),
});
export type EncryptedData = z.infer<typeof encryptedDataSchema>;

export const scheduledPaymentSchema = z.object({
  id: z.string(),
  recipient: z.string(),
  amount: z.string(),
  token: z.string(),
  schedule: z.string(),
  nextExecution: z.string(),
  status: z.enum(["active", "paused", "completed"]),
  isShielded: z.boolean(),
});
export type ScheduledPayment = z.infer<typeof scheduledPaymentSchema>;

export const analyticsDataSchema = z.object({
  metric: z.string(),
  value: z.number(),
  change: z.number(),
  timestamp: z.string(),
});
export type AnalyticsData = z.infer<typeof analyticsDataSchema>;

export const newsItemSchema = z.object({
  id: z.string(),
  title: z.string(),
  summary: z.string(),
  source: z.string(),
  url: z.string(),
  publishedAt: z.string(),
  category: z.string(),
});
export type NewsItem = z.infer<typeof newsItemSchema>;

export const users = {
  id: "varchar",
  username: "text",
  password: "text",
};

export interface User {
  id: string;
  username: string;
  password: string;
}

export interface InsertUser {
  username: string;
  password: string;
}
