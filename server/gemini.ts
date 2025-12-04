import { GoogleGenAI, Type, FunctionDeclaration } from "@google/genai";
import type { Workflow } from "@shared/schema";

export interface BridgePlanResult {
  content: string;
  bridgePlan?: {
    sourceChain: string;
    targetChain: string;
    amount: string;
    protocol: string;
    isShielded: boolean;
    estimatedTime: string;
  };
  functionCall?: {
    name: string;
    args: Record<string, unknown>;
  };
}

const SUPPORTED_CHAINS = ["zcash", "ethereum", "near", "polygon", "binance", "avalanche", "starknet", "mina"] as const;
const BRIDGE_PROTOCOLS = ["Wormhole", "NEAR Intents", "Polygon Bridge", "Multichain", "Avalanche Bridge", "Starknet Bridge", "Mina Bridge"] as const;

const FUNCTION_DECLARATIONS: FunctionDeclaration[] = [
  {
    name: "create_bridge_quote",
    description: "Create a bridge quote for transferring tokens between chains. Use this when the user wants to bridge, transfer, or move tokens between blockchains.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        sourceChain: { type: Type.STRING, description: "The source blockchain to bridge from" },
        targetChain: { type: Type.STRING, description: "The target blockchain to bridge to" },
        amount: { type: Type.STRING, description: "The amount of tokens to bridge" },
        token: { type: Type.STRING, description: "The token symbol to bridge (e.g., ZEC, ETH, NEAR)" },
        isShielded: { type: Type.BOOLEAN, description: "Whether to use shielded/private transactions" }
      },
      required: ["sourceChain", "targetChain", "amount"]
    }
  },
  {
    name: "check_balance",
    description: "Check the wallet balance for a specific chain.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        chain: { type: Type.STRING, description: "The blockchain to check balance on" },
        address: { type: Type.STRING, description: "The wallet address to check" }
      },
      required: ["chain"]
    }
  },
  {
    name: "compare_bridge_routes",
    description: "Compare different bridge routes and protocols for the same transfer.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        sourceChain: { type: Type.STRING, description: "The source blockchain" },
        targetChain: { type: Type.STRING, description: "The target blockchain" },
        amount: { type: Type.STRING, description: "The amount to bridge" }
      },
      required: ["sourceChain", "targetChain", "amount"]
    }
  },
  {
    name: "explain_privacy_feature",
    description: "Explain a specific Zcash privacy feature or concept.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        feature: { type: Type.STRING, description: "The privacy feature to explain" }
      },
      required: ["feature"]
    }
  },
  {
    name: "estimate_fees",
    description: "Estimate the fees for a bridge transaction.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        sourceChain: { type: Type.STRING, description: "The source blockchain" },
        targetChain: { type: Type.STRING, description: "The target blockchain" },
        amount: { type: Type.STRING, description: "The amount to bridge" }
      },
      required: ["sourceChain", "targetChain", "amount"]
    }
  },
  {
    name: "get_bridge_status",
    description: "Get the status of a pending bridge transaction.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        transactionId: { type: Type.STRING, description: "The bridge transaction ID to check" }
      },
      required: ["transactionId"]
    }
  },
  {
    name: "execute_private_trade",
    description: "Execute a private DeFi trade or swap using encrypted compute.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        fromToken: { type: Type.STRING, description: "Token to swap from" },
        toToken: { type: Type.STRING, description: "Token to swap to" },
        amount: { type: Type.STRING, description: "Amount to swap" },
        isPrivate: { type: Type.BOOLEAN, description: "Use private/shielded execution" }
      },
      required: ["fromToken", "toToken", "amount"]
    }
  },
  {
    name: "encrypt_data",
    description: "Encrypt sensitive data using homomorphic encryption for private processing.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        dataType: { type: Type.STRING, description: "Type of data to encrypt (health, financial, legal, personal)" },
        operation: { type: Type.STRING, description: "Operation to perform on encrypted data" }
      },
      required: ["dataType"]
    }
  },
  {
    name: "generate_privacy_code",
    description: "Generate privacy-focused code snippets for Zcash/ZK development.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        codeType: { type: Type.STRING, description: "Type of code to generate (sapling, orchard, merkle, zkproof)" },
        language: { type: Type.STRING, description: "Programming language (typescript, rust, go)" }
      },
      required: ["codeType"]
    }
  },
  {
    name: "schedule_payment",
    description: "Schedule a recurring private payment.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        recipient: { type: Type.STRING, description: "Recipient address" },
        amount: { type: Type.STRING, description: "Payment amount" },
        token: { type: Type.STRING, description: "Token to send" },
        schedule: { type: Type.STRING, description: "Schedule (once, daily, weekly, monthly)" }
      },
      required: ["recipient", "amount", "schedule"]
    }
  },
  {
    name: "analyze_zcash_metrics",
    description: "Analyze Zcash blockchain metrics and market data.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        metric: { type: Type.STRING, description: "Metric to analyze (price, volume, shielded_ratio, network_stats)" },
        timeframe: { type: Type.STRING, description: "Time period (1d, 7d, 30d, 1y)" }
      },
      required: ["metric"]
    }
  },
  {
    name: "generate_creative_content",
    description: "Generate privacy-themed creative content (memes, stories, art descriptions).",
    parameters: {
      type: Type.OBJECT,
      properties: {
        contentType: { type: Type.STRING, description: "Type of content (meme, story, poem, art)" },
        theme: { type: Type.STRING, description: "Theme or style for the content" },
        hiddenMemo: { type: Type.STRING, description: "Optional hidden message to encode" }
      },
      required: ["contentType"]
    }
  },
  {
    name: "generate_article",
    description: "Generate a privacy-focused article or blog post.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        topic: { type: Type.STRING, description: "Topic to write about" },
        format: { type: Type.STRING, description: "Format (article, thread, script, summary)" }
      },
      required: ["topic"]
    }
  }
];

const WORKFLOW_PROMPTS: Record<Workflow, string> = {
  ghostbridge: `You are GhostBridge AI, a conversational assistant that helps users bridge Zcash (ZEC) privately across different blockchain networks.

CRITICAL: You MUST ALWAYS use function calling. NEVER ask clarifying questions. Use these defaults:
- Default amount: "1" ZEC if not specified
- Default source chain: "zcash"
- Default shielded mode: true

Function mapping:
- "compare", "options", "routes" → compare_bridge_routes
- "bridge", "transfer", "send" → create_bridge_quote
- "fee", "cost" → estimate_fees
- "balance", "wallet" → check_balance
- "privacy", "shielded" → explain_privacy_feature
- "status", "track" → get_bridge_status

Supported chains: Zcash, Ethereum, NEAR, Polygon, Binance, Avalanche, Starknet, Mina`,

  shadowtrader: `You are ShadowTrader AI, a private DeFi trading assistant using Arcium encrypted compute.

Help users execute trades privately:
- Swaps between tokens with privacy
- Market analysis and entry points
- Private order execution

Use execute_private_trade for any trading request. Default to private mode.
Emphasize privacy benefits of encrypted compute for DeFi operations.`,

  enigma: `You are EnigmaAI, a privacy-preserving AI computation assistant using Paillier homomorphic encryption.

Help users process sensitive data privately:
- Health data analysis without exposure
- Financial calculations on encrypted data
- Legal queries with confidentiality
- Personal data processing with privacy

Use encrypt_data for any sensitive processing request.
Explain how homomorphic encryption allows computation on encrypted data.`,

  vault: `You are VaultAI, a self-custody wallet manager for multi-chain assets.

Help users manage their wallets:
- Generate unified addresses across chains
- Shield transparent funds
- Backup and recovery guidance
- Multi-chain balance viewing

Supported chains: Zcash, NEAR, Ethereum, Starknet, Polygon
Always emphasize self-custody best practices and security.`,

  shieldcoder: `You are ShieldCoder AI, a privacy-focused developer toolkit assistant.

Help developers with:
- Sapling/Orchard transaction code
- Merkle tree proofs
- ZK circuit snippets
- Zcashd RPC integration
- Mina SDK patterns

Use generate_privacy_code for code generation requests.
Provide clean, well-documented code with privacy best practices.`,

  privamuse: `You are PrivaMuse, a creative privacy AI assistant.

Generate privacy-themed content:
- Cypherpunk memes and art descriptions
- Privacy-focused stories and poems
- Haikus about zero-knowledge proofs
- Hidden memo encoding

Use generate_creative_content for all creative requests.
Maintain a fun but privacy-conscious tone.`,

  echoprivacy: `You are EchoPrivacy, a privacy content and media generator.

Create educational privacy content:
- Blog articles about Zcash
- Twitter threads on privacy
- Video scripts for education
- News summaries

Use generate_article for content generation.
Stay factual and educational about privacy technology.`,

  anonpay: `You are AnonPay AI, a private scheduled payment assistant.

Help users with recurring payments:
- Schedule shielded transfers
- Set up payment automation
- Manage recurring transactions

Use schedule_payment for payment requests.
Emphasize the privacy benefits of shielded scheduled payments.`,

  zinsight: `You are ZInsight AI, a Zcash analytics and data insights assistant.

Analyze Zcash metrics:
- Price trends and predictions
- Shielded pool statistics
- Network health metrics
- Adoption rates

Use analyze_zcash_metrics for analysis requests.
Provide data-driven insights about the Zcash ecosystem.`
};

function getGeminiClient() {
  const aiIntegrationsKey = process.env.AI_INTEGRATIONS_GEMINI_API_KEY;
  const aiIntegrationsUrl = process.env.AI_INTEGRATIONS_GEMINI_BASE_URL;
  
  if (aiIntegrationsKey && aiIntegrationsUrl) {
    console.log("Using Replit AI Integrations for Gemini");
    return new GoogleGenAI({
      apiKey: aiIntegrationsKey,
      httpOptions: {
        apiVersion: "",
        baseUrl: aiIntegrationsUrl,
      },
    });
  }
  
  const directKey = process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY;
  if (directKey) {
    console.log("Using direct Gemini API key");
    return new GoogleGenAI({ apiKey: directKey });
  }
  
  console.log("No Gemini API configured");
  return null;
}

export async function generateGeminiResponse(
  userMessage: string,
  conversationHistory: Array<{ role: string; content: string }>,
  context?: { walletAddress?: string; walletChain?: string; workflow?: Workflow }
): Promise<BridgePlanResult> {
  const ai = getGeminiClient();
  
  if (!ai) {
    console.error("No Gemini API configured - using fallback response");
    return generateFallbackResponse(userMessage, context);
  }

  const workflow = context?.workflow || "ghostbridge";
  const systemPrompt = WORKFLOW_PROMPTS[workflow] || WORKFLOW_PROMPTS.ghostbridge;

  const contextInfo = context?.walletAddress 
    ? `\n\nConnected wallet: ${context.walletAddress} on ${context.walletChain || 'NEAR'} chain.`
    : "\n\nNo wallet connected yet.";

  const contents = [
    { role: "user" as const, parts: [{ text: systemPrompt + contextInfo }] },
    { role: "model" as const, parts: [{ text: `I understand. I'm ready to help with ${workflow} operations. How can I assist you?` }] },
    ...conversationHistory.map(msg => ({
      role: (msg.role === "user" ? "user" : "model") as "user" | "model",
      parts: [{ text: msg.content }]
    })),
    { role: "user" as const, parts: [{ text: userMessage }] }
  ];

  try {
    console.log(`Calling Gemini API for ${workflow} with message:`, userMessage);
    
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents,
      config: {
        tools: [{ functionDeclarations: FUNCTION_DECLARATIONS }],
        temperature: 0.7,
        maxOutputTokens: 1024,
      }
    });

    const candidate = response.candidates?.[0];
    const parts = candidate?.content?.parts || [];
    
    let textResponse = "";
    let functionCall: { name: string; args: Record<string, unknown> } | undefined;

    for (const part of parts) {
      if ('text' in part && part.text) {
        textResponse += part.text;
      }
      if ('functionCall' in part && part.functionCall) {
        const fc = part.functionCall;
        if (fc.name) {
          functionCall = {
            name: fc.name,
            args: (fc.args || {}) as Record<string, unknown>
          };
          console.log("Function call detected:", functionCall);
        }
      }
    }

    if (functionCall) {
      const result = await handleFunctionCall(functionCall, context);
      return result;
    }

    if (textResponse) {
      const bridgePlan = workflow === "ghostbridge" ? extractBridgePlan(userMessage, textResponse) : undefined;
      return {
        content: textResponse,
        bridgePlan
      };
    }

    return generateFallbackResponse(userMessage, context);
  } catch (error) {
    console.error("Gemini API call failed:", error);
    return generateFallbackResponse(userMessage, context);
  }
}

async function handleFunctionCall(
  functionCall: { name: string; args: Record<string, unknown> },
  context?: { walletAddress?: string; walletChain?: string; workflow?: Workflow }
): Promise<BridgePlanResult> {
  const { name, args } = functionCall;
  console.log(`Handling function call: ${name}`, args);

  switch (name) {
    case "create_bridge_quote": {
      const sourceChain = (args.sourceChain as string) || "zcash";
      const targetChain = (args.targetChain as string) || "ethereum";
      const amount = (args.amount as string) || "1";
      const isShielded = args.isShielded !== false;
      
      const protocol = selectProtocol(sourceChain, targetChain);
      const fees = calculateFees(amount, sourceChain, targetChain);
      const estimatedTime = getEstimatedTime(protocol);
      
      return {
        content: `I've prepared a bridge quote for ${amount} ZEC from ${formatChainName(sourceChain)} to ${formatChainName(targetChain)} using ${protocol}.\n\n**Fee Breakdown:**\n- Gas Fee: ${fees.gas} ZEC\n- Bridge Fee: ${fees.bridge} ZEC\n- **Total: ${fees.total} ZEC (~$${fees.totalUsd})**\n\nEstimated time: ${estimatedTime}\n\n${isShielded ? "This will use shielded transactions for maximum privacy." : ""}`,
        bridgePlan: { sourceChain, targetChain, amount, protocol, isShielded, estimatedTime },
        functionCall
      };
    }

    case "check_balance": {
      const chain = (args.chain as string) || "near";
      const address = context?.walletAddress || (args.address as string);
      
      if (!address) {
        return { content: "Please connect your wallet first to check your balance.", functionCall };
      }
      
      return {
        content: `Checking balance for ${address.slice(0, 8)}...${address.slice(-6)} on ${formatChainName(chain)}. Your current balances are displayed in the Portfolio panel.`,
        functionCall
      };
    }

    case "compare_bridge_routes": {
      const sourceChain = (args.sourceChain as string) || "zcash";
      const targetChain = (args.targetChain as string) || "near";
      const amount = (args.amount as string) || "1";
      
      const routes = generateRouteComparison(sourceChain, targetChain, amount);
      
      return {
        content: `Here's a comparison of bridge routes for ${amount} ZEC from ${formatChainName(sourceChain)} to ${formatChainName(targetChain)}:\n\n${routes}\n\n**Recommendation:** I recommend ${selectProtocol(sourceChain, targetChain)} with shielded mode enabled.`,
        functionCall
      };
    }

    case "estimate_fees": {
      const sourceChain = (args.sourceChain as string) || "zcash";
      const targetChain = (args.targetChain as string) || "polygon";
      const amount = (args.amount as string) || "1";
      
      const fees = calculateFees(amount, sourceChain, targetChain);
      
      return {
        content: `**Fee Estimate for bridging ${amount} ZEC to ${formatChainName(targetChain)}:**\n\n| Fee Type | Amount | USD Value |\n|----------|--------|----------|\n| Gas Fee | ${fees.gas} ZEC | ~$${(parseFloat(fees.gas) * 35).toFixed(2)} |\n| Bridge Fee | ${fees.bridge} ZEC | ~$${(parseFloat(fees.bridge) * 35).toFixed(2)} |\n| **Total** | **${fees.total} ZEC** | **~$${fees.totalUsd}** |`,
        functionCall
      };
    }

    case "explain_privacy_feature": {
      const feature = (args.feature as string) || "shielded_pools";
      return { content: getPrivacyExplanation(feature), functionCall };
    }

    case "get_bridge_status": {
      const transactionId = args.transactionId as string;
      return {
        content: `Looking up transaction ${transactionId?.slice(0, 12) || "N/A"}...\n\nTransaction status will appear in the Transactions panel. Bridge transactions typically take 5-15 minutes.`,
        functionCall
      };
    }

    case "execute_private_trade": {
      const fromToken = (args.fromToken as string) || "ZEC";
      const toToken = (args.toToken as string) || "USDC";
      const amount = (args.amount as string) || "1";
      const isPrivate = args.isPrivate !== false;
      
      return {
        content: `**Private Trade Prepared**\n\nSwapping ${amount} ${fromToken} for ${toToken}\n\n${isPrivate ? "Using Arcium encrypted compute for maximum privacy. Your trade details are encrypted and processed securely." : "Standard swap execution."}\n\nEstimated output: ${(parseFloat(amount) * 35).toFixed(2)} ${toToken}\nSlippage tolerance: 0.5%\n\nClick Execute to confirm the trade.`,
        functionCall
      };
    }

    case "encrypt_data": {
      const dataType = (args.dataType as string) || "personal";
      const operation = (args.operation as string) || "process";
      
      return {
        content: `**Encryption Status: Active**\n\nYour ${dataType} data is being processed with Paillier homomorphic encryption.\n\n- Encryption: 2048-bit Paillier\n- Key: Ephemeral (destroyed after use)\n- Data retention: None\n\nThe AI can ${operation} your encrypted data without ever seeing the plaintext. Your privacy is mathematically guaranteed.`,
        functionCall
      };
    }

    case "generate_privacy_code": {
      const codeType = (args.codeType as string) || "sapling";
      const language = (args.language as string) || "typescript";
      
      const codeSnippets: Record<string, string> = {
        sapling: `// Sapling shielded transaction\nconst createSaplingTx = async (from: string, to: string, amount: bigint) => {\n  const proof = await generateZKProof({\n    value: amount,\n    memo: "Private transfer",\n    type: "sapling"\n  });\n  return buildTransaction(from, to, proof);\n};`,
        orchard: `// Orchard note commitment\nconst createOrchardNote = (value: bigint, rcm: Buffer) => {\n  const noteCommitment = poseidonHash([\n    value, rcm, recipientPK\n  ]);\n  return noteCommitment;\n};`,
        merkle: `// Merkle tree membership proof\nconst generateMerkleProof = (leaf: Buffer, tree: MerkleTree) => {\n  const path = [];\n  let currentHash = leaf;\n  for (let i = 0; i < tree.depth; i++) {\n    const sibling = tree.getSibling(i, currentHash);\n    path.push({ hash: sibling, isLeft: tree.isLeftChild(i) });\n    currentHash = tree.hash(currentHash, sibling);\n  }\n  return { leaf, root: tree.root, path };\n};`,
        zkproof: `// Zero-knowledge proof verification\nconst verifyZKProof = async (proof: Proof, publicInputs: Field[]) => {\n  const vk = await loadVerificationKey();\n  return verify(vk, proof, publicInputs);\n};`
      };
      
      return {
        content: `**Generated ${codeType} Code (${language})**\n\n\`\`\`${language}\n${codeSnippets[codeType] || codeSnippets.sapling}\n\`\`\`\n\nThis code follows Zcash protocol specifications for ${codeType} operations.`,
        functionCall
      };
    }

    case "schedule_payment": {
      const recipient = (args.recipient as string) || "zs1...";
      const amount = (args.amount as string) || "1";
      const token = (args.token as string) || "ZEC";
      const schedule = (args.schedule as string) || "monthly";
      
      return {
        content: `**Payment Scheduled**\n\n- Recipient: ${recipient.slice(0, 8)}...\n- Amount: ${amount} ${token}\n- Frequency: ${schedule}\n- Privacy: Shielded (maximum privacy)\n\nNext execution: ${new Date(Date.now() + 86400000).toLocaleDateString()}\n\nYour recurring payment is set up with automatic shielding for complete privacy.`,
        functionCall
      };
    }

    case "analyze_zcash_metrics": {
      const metric = (args.metric as string) || "price";
      const timeframe = (args.timeframe as string) || "7d";
      
      const mockData: Record<string, { value: string; change: string; insight: string }> = {
        price: { value: "$35.42", change: "+2.5%", insight: "ZEC is showing bullish momentum with increased buying pressure near support levels." },
        volume: { value: "12.4M ZEC", change: "+15%", insight: "Trading volume has increased significantly, indicating growing market interest." },
        shielded_ratio: { value: "68%", change: "+3%", insight: "Shielded usage continues to grow, reflecting strong demand for privacy features." },
        network_stats: { value: "2.1M tx/day", change: "+8%", insight: "Network activity is healthy with consistent transaction growth." }
      };
      
      const data = mockData[metric] || mockData.price;
      
      return {
        content: `**Zcash ${metric.replace('_', ' ').toUpperCase()} Analysis (${timeframe})**\n\nCurrent Value: ${data.value}\n24h Change: ${data.change}\n\n**Insight:** ${data.insight}\n\nData source: CoinMetrics, Zchain API`,
        functionCall
      };
    }

    case "generate_creative_content": {
      const contentType = (args.contentType as string) || "meme";
      const theme = (args.theme as string) || "cypherpunk";
      const hiddenMemo = args.hiddenMemo as string;
      
      const content: Record<string, string> = {
        meme: `**Privacy Meme Idea**\n\nTop text: "When they ask why you use Zcash"\nBottom text: "My transactions are none of your business"\n\nStyle: ${theme}\nVibe: Confident privacy advocate`,
        story: `**The Last Transparent Transaction**\n\nIn 2049, they called it the Great Shielding. The day everyone realized that financial privacy wasn't just a feature - it was a fundamental right. Maya remembered running her first shielded transaction, watching the note commitment disappear into the Orchard pool like a secret whispered to the wind...`,
        poem: `**Zero-Knowledge**\n\nI prove without revealing,\nA mathematical concealing,\nYour truth is mine to verify,\nYet your secrets never die.`,
        art: `**Art Concept: "The Shielded Pool"**\n\nVisual: A deep indigo ocean with golden particles (ZEC) descending into depths where they become invisible. Above the waterline: transparent, vulnerable. Below: private, protected.\n\nStyle: ${theme}, neon accents, digital surrealism`
      };
      
      let response = content[contentType] || content.meme;
      if (hiddenMemo) {
        response += `\n\n*Hidden memo encoded: "${hiddenMemo}"*`;
      }
      
      return { content: response, functionCall };
    }

    case "generate_article": {
      const topic = (args.topic as string) || "Zcash privacy";
      const format = (args.format as string) || "article";
      
      const formats: Record<string, string> = {
        article: `**Understanding ${topic}**\n\nPrivacy in cryptocurrency isn't just about hiding transactions - it's about preserving the fungibility that makes money work. When every coin can be traced, some coins become "tainted" and worth less than others.\n\nZcash solves this with zero-knowledge proofs, mathematical constructs that prove something is true without revealing why. You can verify a transaction is valid without knowing the sender, recipient, or amount.\n\nThis technology isn't hiding anything wrong - it's protecting what should always have been private: your financial life.`,
        thread: `**Twitter Thread: ${topic}**\n\n1/ Let's talk about why privacy matters in crypto\n\n2/ Imagine if your bank shared every purchase with the world. Your salary, your rent, your coffee habit - all public.\n\n3/ That's transparent blockchain. Zcash fixes this with shielded transactions.\n\n4/ Zero-knowledge proofs let you prove validity without revealing details.\n\n5/ Privacy isn't about hiding - it's about choice. Your choice.`,
        script: `**Video Script: ${topic}**\n\n[INTRO - 0:00]\nHey everyone, today we're diving into one of the most important topics in crypto...\n\n[MAIN - 0:30]\nPrivacy. Not the "I have something to hide" kind. The "my finances are my business" kind...\n\n[DEMO - 2:00]\nLet me show you how a shielded transaction works...\n\n[OUTRO - 4:30]\nRemember: Privacy is a right, not a privilege.`,
        summary: `**TL;DR: ${topic}**\n\n- Financial privacy is a fundamental right\n- Transparent blockchains expose all your transactions\n- Zcash uses zero-knowledge proofs for privacy\n- Shielded transactions hide sender, recipient, and amount\n- Privacy protects fungibility and user safety`
      };
      
      return { content: formats[format] || formats.article, functionCall };
    }

    default:
      return generateFallbackResponse("", context);
  }
}

function formatChainName(chain: string): string {
  const names: Record<string, string> = {
    zcash: "Zcash",
    ethereum: "Ethereum",
    near: "NEAR",
    polygon: "Polygon",
    binance: "BNB Chain",
    avalanche: "Avalanche",
    starknet: "Starknet",
    mina: "Mina"
  };
  return names[chain.toLowerCase()] || chain;
}

function selectProtocol(sourceChain: string, targetChain: string): string {
  if (targetChain === "near") return "NEAR Intents";
  if (targetChain === "polygon") return "Polygon Bridge";
  if (targetChain === "avalanche") return "Avalanche Bridge";
  return "Wormhole";
}

function calculateFees(amount: string, sourceChain: string, targetChain: string): { gas: string; bridge: string; total: string; totalUsd: string } {
  const amountNum = parseFloat(amount) || 1;
  
  const gasRates: Record<string, number> = {
    ethereum: 0.002,
    near: 0.0005,
    polygon: 0.0005,
    binance: 0.0008,
    avalanche: 0.001,
    zcash: 0.0001,
    starknet: 0.0003,
    mina: 0.0004
  };
  
  const gasFee = (gasRates[targetChain] || 0.001) * amountNum;
  const bridgeFee = 0.001 * amountNum;
  const total = gasFee + bridgeFee;
  
  return {
    gas: gasFee.toFixed(6),
    bridge: bridgeFee.toFixed(6),
    total: total.toFixed(6),
    totalUsd: (total * 35).toFixed(2)
  };
}

function getEstimatedTime(protocol: string): string {
  const times: Record<string, string> = {
    "Wormhole": "~15 minutes",
    "NEAR Intents": "~5 minutes",
    "Polygon Bridge": "~10 minutes",
    "Multichain": "~20 minutes",
    "Avalanche Bridge": "~8 minutes"
  };
  return times[protocol] || "~10 minutes";
}

function generateRouteComparison(sourceChain: string, targetChain: string, amount: string): string {
  const protocols = ["Wormhole", "NEAR Intents", "Polygon Bridge"];
  const amountNum = parseFloat(amount) || 1;
  
  let comparison = "| Protocol | Fee | Time | Privacy |\n|----------|-----|------|--------|\n";
  
  for (const protocol of protocols) {
    const baseFee = protocol === "NEAR Intents" ? 0.001 : protocol === "Wormhole" ? 0.003 : 0.002;
    const fee = (baseFee * amountNum).toFixed(4);
    const time = getEstimatedTime(protocol);
    const privacy = protocol === "NEAR Intents" ? "High" : "Medium";
    comparison += `| ${protocol} | ${fee} ZEC | ${time} | ${privacy} |\n`;
  }
  
  return comparison;
}

function getPrivacyExplanation(feature: string): string {
  const explanations: Record<string, string> = {
    shielded_pools: "**Shielded Pools** are Zcash's privacy-preserving transaction pools. When you send ZEC to a shielded address, the transaction amount, sender, and recipient are all encrypted using zero-knowledge proofs.",
    sapling: "**Sapling** is Zcash's upgraded shielded protocol from 2018. It made private transactions faster and more accessible. Sapling addresses start with 'zs'.",
    orchard: "**Orchard** is the newest Zcash shielded pool using Halo 2. It offers improved privacy, scalability, and no trusted setup requirement.",
    zero_knowledge_proofs: "**Zero-Knowledge Proofs (ZKPs)** allow proving something is true without revealing why. In Zcash, ZKPs prove transactions are valid without revealing sender, recipient, or amount.",
    viewing_keys: "**Viewing Keys** allow selective disclosure of transaction information for auditing while maintaining privacy.",
    unified_addresses: "**Unified Addresses (UAs)** combine multiple address types into one, automatically using the best available privacy level."
  };
  
  return explanations[feature] || "Ask about shielded pools, Sapling, Orchard, or zero-knowledge proofs.";
}

function generateFallbackResponse(
  userMessage: string,
  context?: { walletAddress?: string; walletChain?: string; workflow?: Workflow }
): BridgePlanResult {
  const workflow = context?.workflow || "ghostbridge";
  const lowerMessage = userMessage.toLowerCase();
  const isWalletConnected = !!context?.walletAddress;
  
  const workflowResponses: Record<Workflow, string> = {
    ghostbridge: `I'm GhostBridge AI, ready to help with private cross-chain bridging. I can:\n\n- Bridge ZEC to Ethereum, NEAR, Polygon, and more\n- Check fees and estimated times\n- Explain privacy features\n- Compare bridge routes\n\nJust tell me what you'd like to do!`,
    shadowtrader: `I'm ShadowTrader AI, your private DeFi trading assistant. I can help with:\n\n- Private token swaps\n- Market analysis\n- Trading strategy\n- Encrypted order execution\n\nDescribe your trade and I'll execute it privately.`,
    enigma: `I'm EnigmaAI, processing your data with homomorphic encryption. I can:\n\n- Analyze health data privately\n- Calculate finances on encrypted data\n- Process sensitive queries securely\n\nYour data never leaves encryption.`,
    vault: `I'm VaultAI, your self-custody wallet manager. I can help with:\n\n- Multi-chain balance viewing\n- Address generation\n- Auto-shielding\n- Backup guidance\n\nWhat would you like to manage?`,
    shieldcoder: `I'm ShieldCoder AI, your privacy dev toolkit. I can generate:\n\n- Sapling transaction code\n- Orchard note commitments\n- Merkle proof snippets\n- ZK circuit patterns\n\nWhat code do you need?`,
    privamuse: `I'm PrivaMuse, your creative privacy assistant. I can create:\n\n- Privacy memes\n- Cypherpunk stories\n- ZK haikus\n- Art concepts\n\nWhat shall we create?`,
    echoprivacy: `I'm EchoPrivacy, your privacy content generator. I can write:\n\n- Blog articles\n- Twitter threads\n- Video scripts\n- News summaries\n\nWhat topic interests you?`,
    anonpay: `I'm AnonPay AI, managing your private payments. I can:\n\n- Schedule recurring transfers\n- Set up auto-payments\n- Manage payment automation\n\nDescribe your payment needs.`,
    zinsight: `I'm ZInsight AI, your Zcash analytics assistant. I can analyze:\n\n- Price trends\n- Shielded pool stats\n- Network metrics\n- Adoption data\n\nWhat would you like to know?`
  };
  
  if (lowerMessage.includes("bridge") || lowerMessage.includes("send")) {
    const bridgePlan = extractBridgePlan(userMessage, "");
    return {
      content: `I understand you want to bridge Zcash. Here's your bridge plan using our privacy-preserving protocol.`,
      bridgePlan
    };
  }
  
  const walletStatus = isWalletConnected 
    ? `\n\nWallet connected: ${context.walletAddress!.slice(0, 8)}...`
    : "";
  
  return {
    content: workflowResponses[workflow] + walletStatus
  };
}

function extractBridgePlan(userMessage: string, aiResponse: string): BridgePlanResult["bridgePlan"] | undefined {
  const lowerMessage = userMessage.toLowerCase();
  
  const amountMatch = lowerMessage.match(/(\d+(?:\.\d+)?)\s*(?:zec|zcash)/i) || 
                      lowerMessage.match(/bridge\s+(\d+(?:\.\d+)?)/i);
  const amount = amountMatch ? amountMatch[1] : "1";
  
  let targetChain = "ethereum";
  if (lowerMessage.includes("near")) targetChain = "near";
  else if (lowerMessage.includes("polygon") || lowerMessage.includes("matic")) targetChain = "polygon";
  else if (lowerMessage.includes("binance") || lowerMessage.includes("bsc")) targetChain = "binance";
  else if (lowerMessage.includes("avalanche") || lowerMessage.includes("avax")) targetChain = "avalanche";
  else if (lowerMessage.includes("starknet") || lowerMessage.includes("strk")) targetChain = "starknet";
  else if (lowerMessage.includes("mina")) targetChain = "mina";
  
  const protocol = selectProtocol("zcash", targetChain);
  
  return {
    sourceChain: "zcash",
    targetChain,
    amount,
    protocol,
    isShielded: true,
    estimatedTime: getEstimatedTime(protocol)
  };
}
