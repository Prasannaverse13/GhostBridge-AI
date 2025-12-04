import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { generateGeminiResponse } from "./gemini";
import { fetchAllBalances } from "./balance-service";
import { bridgeService, type BridgeQuote, type BridgeExecution } from "./bridge-service";
import { chatRequestSchema, chainSchema, type BridgePlan, type ChatMessage } from "@shared/schema";
import { randomUUID } from "crypto";
import { z } from "zod";

const bridgeQuoteRequestSchema = z.object({
  sourceChain: chainSchema,
  targetChain: chainSchema,
  amount: z.string().refine((val) => {
    const num = parseFloat(val);
    return !isNaN(num) && num > 0;
  }, "Amount must be a positive number"),
  isShielded: z.boolean().optional().default(true),
  preferredProtocol: z.enum(["wormhole", "near_intents", "polygon_bridge", "multichain", "avalanche_bridge", "starknet_bridge", "mina_bridge"]).optional(),
  slippageTolerance: z.number().min(0).max(50).optional(),
});

const bridgeExecuteRequestSchema = z.object({
  quote: z.object({
    id: z.string(),
    protocol: z.string(),
    sourceChain: chainSchema,
    targetChain: chainSchema,
    sourceToken: z.string(),
    targetToken: z.string(),
    inputAmount: z.string(),
    outputAmount: z.string(),
    fees: z.object({
      bridgeFee: z.string(),
      gasFee: z.string(),
      protocolFee: z.string(),
      totalFee: z.string(),
      totalFeeUsd: z.string(),
    }),
    estimatedTime: z.number(),
    slippageTolerance: z.number(),
    route: z.array(z.object({
      step: z.number(),
      protocol: z.string(),
      action: z.string(),
      chain: z.string(),
      description: z.string(),
      estimatedDuration: z.number(),
    })),
    isShielded: z.boolean(),
    expiresAt: z.string(),
    securityLevel: z.enum(["standard", "enhanced", "maximum"]),
  }),
  signerAddress: z.string().min(1, "Signer address is required"),
});

function generateBridgePlan(extracted: {
  sourceChain: string;
  targetChain: string;
  amount: string;
  protocol: string;
  isShielded: boolean;
  estimatedTime: string;
}): BridgePlan {
  const feeMultipliers: Record<string, number> = {
    ethereum: 0.003,
    near: 0.001,
    polygon: 0.0005,
    binance: 0.001,
    avalanche: 0.002,
  };

  const amount = parseFloat(extracted.amount);
  const multiplier = feeMultipliers[extracted.targetChain] || 0.002;
  const gasFee = (amount * multiplier).toFixed(6);
  const bridgeFee = (amount * 0.001).toFixed(6);
  const totalFee = (parseFloat(gasFee) + parseFloat(bridgeFee)).toFixed(6);
  const totalUsd = `$${(parseFloat(totalFee) * 35).toFixed(2)}`;

  return {
    id: randomUUID(),
    sourceChain: extracted.sourceChain as any,
    targetChain: extracted.targetChain as any,
    amount: extracted.amount,
    protocol: extracted.protocol,
    estimatedFees: {
      gas: `${gasFee} ZEC`,
      bridge: `${bridgeFee} ZEC`,
      total: `${totalFee} ZEC`,
      totalUsd,
    },
    steps: [
      {
        step: 1,
        title: "Prepare Shielded Transaction",
        description: "Creating shielded output using Sapling pool",
        status: "pending",
      },
      {
        step: 2,
        title: "Lock ZEC on Zcash",
        description: "Locking funds in the bridge contract",
        status: "pending",
      },
      {
        step: 3,
        title: "Generate Bridge Proof",
        description: "Creating zero-knowledge proof for cross-chain verification",
        status: "pending",
      },
      {
        step: 4,
        title: `Mint wZEC on ${extracted.targetChain.charAt(0).toUpperCase() + extracted.targetChain.slice(1)}`,
        description: "Minting wrapped ZEC on target chain",
        status: "pending",
      },
    ],
    isShielded: extracted.isShielded,
    estimatedTime: extracted.estimatedTime,
  };
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  app.post("/api/chat", async (req, res) => {
    try {
      const parseResult = chatRequestSchema.safeParse(req.body);
      
      if (!parseResult.success) {
        return res.status(400).json({ 
          error: "Invalid request", 
          details: parseResult.error.issues 
        });
      }

      const { message, workflow, conversationHistory = [] } = parseResult.data;
      
      const sessionId = req.headers["x-session-id"] as string || "default";
      const walletAddress = req.headers["x-wallet-address"] as string | undefined;
      const walletChain = req.headers["x-wallet-chain"] as string | undefined;

      const context = { 
        walletAddress, 
        walletChain, 
        workflow: workflow || "ghostbridge" as const 
      };
      const geminiResult = await generateGeminiResponse(message, conversationHistory, context);

      let bridgePlan: BridgePlan | undefined;
      if (geminiResult.bridgePlan) {
        bridgePlan = generateBridgePlan(geminiResult.bridgePlan);
        await storage.setActiveBridgePlan(sessionId, bridgePlan);
      }

      const aiMessage: ChatMessage = {
        id: randomUUID(),
        role: "assistant",
        content: geminiResult.content,
        timestamp: new Date().toISOString(),
        bridgePlan,
      };

      await storage.addChatMessage(sessionId, {
        role: "user",
        content: message,
      });
      await storage.addChatMessage(sessionId, {
        role: "assistant",
        content: geminiResult.content,
        bridgePlan,
      });

      res.json({
        message: aiMessage,
        bridgePlan,
        functionCall: geminiResult.functionCall,
      });
    } catch (error) {
      console.error("Chat error:", error);
      res.status(500).json({ 
        error: "Failed to process chat message",
        message: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  app.get("/api/chat/history", async (req, res) => {
    try {
      const sessionId = req.headers["x-session-id"] as string || "default";
      const messages = await storage.getChatMessages(sessionId);
      res.json({ messages });
    } catch (error) {
      console.error("History error:", error);
      res.status(500).json({ error: "Failed to get chat history" });
    }
  });

  app.delete("/api/chat/history", async (req, res) => {
    try {
      const sessionId = req.headers["x-session-id"] as string || "default";
      await storage.clearChatMessages(sessionId);
      await storage.clearActiveBridgePlan(sessionId);
      res.json({ success: true });
    } catch (error) {
      console.error("Clear history error:", error);
      res.status(500).json({ error: "Failed to clear chat history" });
    }
  });

  app.get("/api/bridge/plan", async (req, res) => {
    try {
      const sessionId = req.headers["x-session-id"] as string || "default";
      const plan = await storage.getActiveBridgePlan(sessionId);
      res.json({ plan });
    } catch (error) {
      console.error("Get plan error:", error);
      res.status(500).json({ error: "Failed to get bridge plan" });
    }
  });

  app.get("/api/health", (req, res) => {
    const hasAiIntegrations = !!(process.env.AI_INTEGRATIONS_GEMINI_API_KEY && process.env.AI_INTEGRATIONS_GEMINI_BASE_URL);
    const hasApiKey = !!(process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY);
    res.json({ 
      status: "ok", 
      service: "GhostBridge AI",
      geminiConfigured: hasAiIntegrations || hasApiKey,
      usingAiIntegrations: hasAiIntegrations,
      timestamp: new Date().toISOString()
    });
  });

  app.get("/api/chat/history/:sessionId", async (req, res) => {
    try {
      const { sessionId } = req.params;
      const messages = await storage.getChatMessages(sessionId);
      res.json({ messages });
    } catch (error) {
      console.error("Error fetching chat history:", error);
      res.status(500).json({ error: "Failed to fetch chat history" });
    }
  });

  app.delete("/api/chat/history/:sessionId", async (req, res) => {
    try {
      const { sessionId } = req.params;
      await storage.clearChatMessages(sessionId);
      res.json({ success: true, message: "Chat history cleared" });
    } catch (error) {
      console.error("Error clearing chat history:", error);
      res.status(500).json({ error: "Failed to clear chat history" });
    }
  });

  app.get("/api/transactions", (req, res) => {
    res.json({ transactions: [] });
  });

  app.post("/api/bridge/simulate", async (req, res) => {
    try {
      const { sourceChain, targetChain, amount } = req.body;

      if (!sourceChain || !targetChain || !amount) {
        return res.status(400).json({ 
          error: "Missing required fields: sourceChain, targetChain, amount" 
        });
      }

      const feeMultipliers: Record<string, number> = {
        ethereum: 0.003,
        near: 0.001,
        polygon: 0.0005,
        binance: 0.001,
        avalanche: 0.002,
      };

      const protocols: Record<string, string> = {
        ethereum: "Wormhole",
        near: "NEAR Intents",
        polygon: "Polygon Bridge",
        binance: "Multichain",
        avalanche: "Avalanche Bridge"
      };

      const times: Record<string, string> = {
        ethereum: "~15 minutes",
        near: "~5 minutes",
        polygon: "~10 minutes",
        binance: "~12 minutes",
        avalanche: "~8 minutes"
      };

      const parsedAmount = parseFloat(amount);
      const multiplier = feeMultipliers[targetChain] || 0.002;
      const gasFee = (parsedAmount * multiplier).toFixed(6);
      const bridgeFee = (parsedAmount * 0.001).toFixed(6);
      const totalFee = (parseFloat(gasFee) + parseFloat(bridgeFee)).toFixed(6);

      const simulation = {
        sourceChain,
        targetChain,
        amount: amount.toString(),
        protocol: protocols[targetChain] || "GhostBridge Protocol",
        estimatedFees: {
          gas: `${gasFee} ZEC`,
          bridge: `${bridgeFee} ZEC`,
          total: `${totalFee} ZEC`,
          totalUsd: `$${(parseFloat(totalFee) * 35).toFixed(2)}`,
        },
        estimatedTime: times[targetChain] || "~10 minutes",
        isShielded: true,
        networkStatus: "healthy",
        liquidityAvailable: true,
      };

      res.json({ simulation });
    } catch (error) {
      console.error("Bridge simulation error:", error);
      res.status(500).json({ error: "Failed to simulate bridge transaction" });
    }
  });

  app.get("/api/balances", async (req, res) => {
    try {
      const { zcash, near, ethereum, polygon } = req.query;
      
      const addresses = {
        zcash: zcash as string | undefined,
        near: near as string | undefined,
        ethereum: ethereum as string | undefined,
        polygon: polygon as string | undefined,
      };
      
      const hasAddresses = Object.values(addresses).some(Boolean);
      
      if (!hasAddresses) {
        return res.json({
          balances: [],
          totalUsdValue: "$0.00",
        });
      }
      
      const balances = await fetchAllBalances(addresses);
      res.json(balances);
    } catch (error) {
      console.error("Error fetching balances:", error);
      res.status(500).json({ error: "Failed to fetch balances" });
    }
  });

  app.get("/api/prices", async (req, res) => {
    try {
      const prices = {
        ZEC: { usd: 35.0, change24h: 2.5 },
        NEAR: { usd: 5.5, change24h: -1.2 },
        ETH: { usd: 3500.0, change24h: 1.8 },
        MATIC: { usd: 0.85, change24h: 0.5 },
        BNB: { usd: 580.0, change24h: 0.8 },
        AVAX: { usd: 35.0, change24h: 3.2 },
      };
      res.json({ prices, lastUpdated: new Date().toISOString() });
    } catch (error) {
      console.error("Error fetching prices:", error);
      res.status(500).json({ error: "Failed to fetch prices" });
    }
  });

  app.post("/api/bridge/quote", async (req, res) => {
    try {
      const parseResult = bridgeQuoteRequestSchema.safeParse(req.body);
      
      if (!parseResult.success) {
        return res.status(400).json({ 
          error: "Invalid request",
          details: parseResult.error.issues 
        });
      }

      const { sourceChain, targetChain, amount, isShielded, preferredProtocol, slippageTolerance } = parseResult.data;

      const quote = await bridgeService.getQuote({
        sourceChain,
        targetChain,
        amount,
        isShielded,
        preferredProtocol,
        slippageTolerance,
      });

      res.json({ quote });
    } catch (error) {
      console.error("Bridge quote error:", error);
      const message = error instanceof Error ? error.message : "Unknown error";
      const isValidationError = 
        message.includes("not currently supported") || 
        message.includes("No compatible") ||
        message.includes("does not support");
      res.status(isValidationError ? 400 : 500).json({ 
        error: isValidationError ? "Unsupported bridge route" : "Failed to get bridge quote",
        message
      });
    }
  });

  app.post("/api/bridge/quotes", async (req, res) => {
    try {
      const parseResult = bridgeQuoteRequestSchema.omit({ preferredProtocol: true, slippageTolerance: true }).safeParse(req.body);
      
      if (!parseResult.success) {
        return res.status(400).json({ 
          error: "Invalid request",
          details: parseResult.error.issues 
        });
      }

      const { sourceChain, targetChain, amount, isShielded } = parseResult.data;

      const quotes = await bridgeService.getMultipleQuotes({
        sourceChain,
        targetChain,
        amount,
        isShielded,
      });

      res.json({ quotes, count: quotes.length });
    } catch (error) {
      console.error("Bridge quotes error:", error);
      const message = error instanceof Error ? error.message : "Unknown error";
      const isValidationError = 
        message.includes("not currently supported") || 
        message.includes("No compatible") ||
        message.includes("does not support");
      res.status(isValidationError ? 400 : 500).json({ 
        error: isValidationError ? "Unsupported bridge route" : "Failed to get bridge quotes",
        message
      });
    }
  });

  app.post("/api/bridge/execute", async (req, res) => {
    try {
      const parseResult = bridgeExecuteRequestSchema.safeParse(req.body);
      
      if (!parseResult.success) {
        return res.status(400).json({ 
          error: "Invalid request",
          details: parseResult.error.issues 
        });
      }

      const { quote, signerAddress } = parseResult.data;

      const execution = await bridgeService.executeQuote(quote as BridgeQuote, signerAddress);
      res.json({ execution });
    } catch (error) {
      console.error("Bridge execution error:", error);
      res.status(500).json({ 
        error: "Failed to execute bridge",
        message: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  app.get("/api/bridge/execution/:executionId", async (req, res) => {
    try {
      const { executionId } = req.params;
      const execution = bridgeService.getExecutionStatus(executionId);

      if (!execution) {
        return res.status(404).json({ error: "Execution not found" });
      }

      res.json({ execution });
    } catch (error) {
      console.error("Get execution error:", error);
      res.status(500).json({ error: "Failed to get execution status" });
    }
  });

  app.get("/api/bridge/protocols", async (req, res) => {
    try {
      const protocols = bridgeService.getSupportedProtocols();
      const chains = bridgeService.getSupportedChains();
      res.json({ protocols, chains });
    } catch (error) {
      console.error("Get protocols error:", error);
      res.status(500).json({ error: "Failed to get supported protocols" });
    }
  });

  app.get("/api/bridge/history", async (req, res) => {
    try {
      const walletAddress = req.query.wallet as string;
      const limit = parseInt(req.query.limit as string) || 10;

      if (!walletAddress) {
        return res.status(400).json({ error: "Wallet address is required" });
      }

      const executions = await storage.getBridgeExecutionsByWallet(walletAddress, limit);
      res.json({ executions });
    } catch (error) {
      console.error("Get bridge history error:", error);
      res.status(500).json({ error: "Failed to get bridge history" });
    }
  });

  return httpServer;
}
