# GhostBridge AI - Unified Privacy Platform

<div align="center">

![GhostBridge AI](https://img.shields.io/badge/GhostBridge-AI-gold?style=for-the-badge&logo=shield&logoColor=black)
![Version](https://img.shields.io/badge/version-1.0.0-blue?style=for-the-badge)
![License](https://img.shields.io/badge/license-MIT-green?style=for-the-badge)

**A comprehensive privacy-focused platform integrating 9 specialized AI workflows for Zcash and cross-chain privacy operations**

[Features](#-features) | [Architecture](#-architecture) | [Workflows](#-9-privacy-workflows) | [Tech Stack](#-tech-stack) | [API Reference](#-api-reference)

</div>

---

## Introduction

GhostBridge AI is a unified privacy platform that consolidates 9 specialized AI-powered workflows into a single, seamless interface. Built with a focus on privacy-preserving technologies, it enables users to perform cross-chain bridging, private DeFi trading, encrypted computation, and more - all through natural language conversations powered by Google's Gemini AI.

The platform is designed around the Zcash ecosystem, emphasizing shielded transactions, zero-knowledge proofs, and privacy-first operations across 8 supported blockchains.

---

## Use Cases

| Use Case | Description | Workflow |
|----------|-------------|----------|
| **Cross-Chain Bridging** | Move assets privately between 8 blockchains with shielded transactions | GhostBridge AI |
| **Private Trading** | Execute DeFi trades with encrypted order books and MEV protection | ShadowTrader AI |
| **Encrypted Computation** | Perform calculations on encrypted data using homomorphic encryption | EnigmaAI |
| **Multi-Chain Wallet** | Manage assets across multiple chains with unified balance tracking | VaultAI |
| **Privacy Development** | Generate ZK circuits, smart contracts, and privacy-focused code | ShieldCoder AI |
| **Creative Privacy Content** | Create privacy-themed memes, stories, and educational art | PrivaMuse |
| **Educational Media** | Generate articles and content for privacy education | EchoPrivacy |
| **Scheduled Payments** | Set up recurring private payments with shielded transactions | AnonPay AI |
| **Blockchain Analytics** | Analyze Zcash metrics, shielded pool data, and market insights | ZInsight AI |

---

## Architecture

```
+-----------------------------------------------------------------------------------+
|                              CLIENT (Browser)                                       |
|  +-----------------------------------------------------------------------------+  |
|  |                         React Application                                    |  |
|  |  +-------------------------+  +-------------------------+  +-------------+  |  |
|  |  |    Wallet Context       |  |    TanStack Query       |  |   Wouter    |  |  |
|  |  |  (NEAR Wallet Selector) |  |   (State Management)    |  |  (Routing)  |  |  |
|  |  +-------------------------+  +-------------------------+  +-------------+  |  |
|  |                                      |                                       |  |
|  |  +-------------------------------------------------------------------+      |  |
|  |  |                    GhostBridge Page (Unified UI)                   |      |  |
|  |  |  +------------------+  +------------------+  +------------------+  |      |  |
|  |  |  |  Workflow Tabs   |  |   Chat Interface |  |  Balance Panel   |  |      |  |
|  |  |  |  (9 Workflows)   |  |  (AI Responses)  |  | (Multi-Chain)    |  |      |  |
|  |  |  +------------------+  +------------------+  +------------------+  |      |  |
|  |  +-------------------------------------------------------------------+      |  |
|  +-----------------------------------------------------------------------------+  |
+-----------------------------------------------------------------------------------+
                                        |
                                   HTTP/REST API
                                        |
+-----------------------------------------------------------------------------------+
|                              SERVER (Express.js)                                   |
|  +-----------------------------------------------------------------------------+  |
|  |                            API Routes                                        |  |
|  |  +------------------+  +------------------+  +------------------+            |  |
|  |  |   /api/chat      |  |  /api/bridge/*   |  |  /api/balances   |            |  |
|  |  |  (AI Messages)   |  | (Bridge Ops)     |  | (Chain Balances) |            |  |
|  |  +------------------+  +------------------+  +------------------+            |  |
|  +-----------------------------------------------------------------------------+  |
|                                        |                                          |
|  +------------------+  +------------------+  +------------------+                 |
|  |   Gemini AI      |  |  Bridge Service  |  | Balance Service  |                 |
|  | (Function Call)  |  | (8 Chains)       |  | (RPC Queries)    |                 |
|  +------------------+  +------------------+  +------------------+                 |
|                                        |                                          |
|  +-----------------------------------------------------------------------------+  |
|  |                         In-Memory Storage                                    |  |
|  |    Chat History | Bridge Plans | Execution Records | Session Data           |  |
|  +-----------------------------------------------------------------------------+  |
+-----------------------------------------------------------------------------------+
                                        |
                        +---------------+---------------+
                        |               |               |
              +---------+-----+ +-------+-------+ +-----+---------+
              |  Zcash API    | |  NEAR RPC     | |  EVM RPCs     |
              | (Blockchair)  | | (Testnet)     | | (ETH/MATIC)   |
              +---------------+ +---------------+ +---------------+
```

---

## 9 Privacy Workflows

### 1. GhostBridge AI - Cross-Chain Bridge
**Purpose:** Private ZEC bridging across 8 blockchains with shielded transaction support.

| Resource/Tool | Usage | File Location |
|---------------|-------|---------------|
| Gemini AI | Natural language bridge planning | `server/gemini.ts` |
| Bridge Service | Quote generation, route calculation | `server/bridge-service.ts` |
| NEAR Wallet | Transaction signing | `client/src/lib/wallet-context.tsx` |
| Bridge Execution Modal | Transaction UI | `client/src/components/bridge/bridge-execution-modal.tsx` |

**AI Functions:**
- `create_bridge_quote` - Generate bridge quotes with fees
- `check_balance` - Query wallet balances
- `compare_bridge_routes` - Compare protocols
- `explain_privacy_feature` - Explain Zcash privacy

---

### 2. ShadowTrader AI - Private DeFi Trading
**Purpose:** Execute private trades with MEV protection and encrypted order books.

| Resource/Tool | Usage | File Location |
|---------------|-------|---------------|
| Gemini AI | Trade analysis and execution | `server/gemini.ts` |
| Trade Order Schema | Order data validation | `shared/schema.ts` |
| Chart.js | Price visualization | `client/src/pages/ghostbridge.tsx` |

**AI Functions:**
- `execute_private_trade` - Private swap execution
- `analyze_market` - Market analysis
- `set_stop_loss` - Risk management

---

### 3. EnigmaAI - Privacy-Preserving Computation
**Purpose:** Perform encrypted computations using Paillier homomorphic encryption.

| Resource/Tool | Usage | File Location |
|---------------|-------|---------------|
| Gemini AI | Encryption guidance | `server/gemini.ts` |
| paillier-bigint | Homomorphic encryption | `package.json` (dependency) |
| Encrypted Data Schema | Data validation | `shared/schema.ts` |

**AI Functions:**
- `encrypt_data` - Homomorphic encryption
- `compute_encrypted` - Encrypted operations
- `explain_zk_proof` - ZK proof explanation

---

### 4. VaultAI - Self-Custody Wallet Manager
**Purpose:** Unified multi-chain asset management with real-time balance tracking.

| Resource/Tool | Usage | File Location |
|---------------|-------|---------------|
| Balance Service | Multi-chain balance fetching | `server/balance-service.ts` |
| NEAR Wallet Selector | Wallet connection | `client/src/lib/wallet-context.tsx` |
| Balance Panel | Balance display UI | `client/src/components/balance-panel.tsx` |
| Chain Icons | Blockchain logos | `client/src/components/icons/chain-icons.tsx` |

**AI Functions:**
- `check_balance` - Query balances
- `generate_address` - Address generation
- `export_keys` - Key management

---

### 5. ShieldCoder AI - Privacy Developer Toolkit
**Purpose:** Generate ZK circuits, privacy-focused smart contracts, and code snippets.

| Resource/Tool | Usage | File Location |
|---------------|-------|---------------|
| Gemini AI | Code generation | `server/gemini.ts` |
| Workflow Prompts | Developer context | `server/gemini.ts` (WORKFLOW_PROMPTS) |

**AI Functions:**
- `generate_privacy_code` - ZK/privacy code generation
- `explain_circuit` - Circuit explanation
- `audit_privacy` - Privacy audit

---

### 6. PrivaMuse - Creative Privacy Apps
**Purpose:** Create privacy-themed memes, stories, artwork, and creative content.

| Resource/Tool | Usage | File Location |
|---------------|-------|---------------|
| Gemini AI | Creative content generation | `server/gemini.ts` |
| Workflow Prompts | Creative context | `server/gemini.ts` (WORKFLOW_PROMPTS) |

**AI Functions:**
- `generate_meme` - Privacy meme creation
- `write_story` - Privacy narrative generation
- `create_art_prompt` - Art description generation

---

### 7. EchoPrivacy - Content & Media Generation
**Purpose:** Generate educational articles and content for privacy education.

| Resource/Tool | Usage | File Location |
|---------------|-------|---------------|
| Gemini AI | Article generation | `server/gemini.ts` |
| RSS Parser | News aggregation | `package.json` (dependency) |

**AI Functions:**
- `generate_article` - Educational content
- `summarize_news` - Privacy news summary
- `create_infographic` - Visual content description

---

### 8. AnonPay AI - Private Scheduled Payments
**Purpose:** Set up recurring private payments with shielded transaction support.

| Resource/Tool | Usage | File Location |
|---------------|-------|---------------|
| Gemini AI | Payment scheduling | `server/gemini.ts` |
| node-cron | Schedule execution | `package.json` (dependency) |
| Scheduled Payment Schema | Payment validation | `shared/schema.ts` |

**AI Functions:**
- `schedule_payment` - Create recurring payments
- `cancel_payment` - Cancel schedules
- `list_payments` - View active payments

---

### 9. ZInsight AI - Zcash Analytics
**Purpose:** Analyze Zcash blockchain metrics, shielded pool data, and market insights.

| Resource/Tool | Usage | File Location |
|---------------|-------|---------------|
| Gemini AI | Data analysis | `server/gemini.ts` |
| Chart.js | Data visualization | `client/src/pages/ghostbridge.tsx` |
| Analytics Data Schema | Metrics validation | `shared/schema.ts` |

**AI Functions:**
- `analyze_zcash_metrics` - Blockchain analytics
- `get_shielded_stats` - Shielded pool analysis
- `predict_trend` - Market predictions

---

## Tech Stack

### Frontend Technologies

| Technology | Purpose | File Location |
|------------|---------|---------------|
| **React 18** | UI framework | `client/src/` |
| **TypeScript** | Type safety | All `.ts` and `.tsx` files |
| **TailwindCSS** | Styling | `client/src/index.css`, `tailwind.config.ts` |
| **Shadcn UI** | Component library | `client/src/components/ui/` |
| **Wouter** | Client-side routing | `client/src/App.tsx` |
| **TanStack Query** | Server state management | `client/src/lib/queryClient.ts` |
| **Chart.js** | Data visualization | `client/src/pages/ghostbridge.tsx` |
| **Lucide React** | Icon library | All component files |
| **Framer Motion** | Animations | `package.json` (dependency) |

### Backend Technologies

| Technology | Purpose | File Location |
|------------|---------|---------------|
| **Express.js** | HTTP server | `server/index.ts`, `server/routes.ts` |
| **TypeScript** | Type safety | All server files |
| **Google Gemini AI** | AI responses & function calling | `server/gemini.ts` |
| **Zod** | Schema validation | `shared/schema.ts`, `server/routes.ts` |
| **In-Memory Storage** | Data persistence | `server/storage.ts` |

### Blockchain Integrations

| Chain | RPC/API | File Location |
|-------|---------|---------------|
| **NEAR Protocol** | `rpc.testnet.near.org` | `server/balance-service.ts`, `client/src/lib/wallet-context.tsx` |
| **Ethereum** | `eth-mainnet.public.blastapi.io` | `server/balance-service.ts` |
| **Polygon** | `polygon-rpc.com` | `server/balance-service.ts` |
| **Zcash** | `api.blockchair.com/zcash` | `server/balance-service.ts` |
| **Binance Smart Chain** | Bridge support | `server/bridge-service.ts` |
| **Avalanche** | Bridge support | `server/bridge-service.ts` |
| **Starknet** | Bridge support | `server/bridge-service.ts` |
| **Mina Protocol** | Bridge support | `server/bridge-service.ts` |

### Wallet Integration

| Wallet | Support Type | File Location |
|--------|--------------|---------------|
| **NEAR Wallet Selector** | Primary integration | `client/src/lib/wallet-context.tsx` |
| **MyNearWallet** | NEAR wallet | `client/src/lib/wallet-context.tsx` |
| **Meteor Wallet** | NEAR wallet | `package.json` (dependency) |
| **HOT Wallet** | NEAR wallet | `package.json` (dependency) |
| **Ledger** | Hardware wallet | `package.json` (dependency) |

---

## Project Structure

```
ghostbridge-ai/
+-- client/                          # Frontend React application
|   +-- src/
|   |   +-- components/
|   |   |   +-- bridge/              # Bridge execution components
|   |   |   |   +-- bridge-execution-modal.tsx
|   |   |   |   +-- bridge-execution-tracker.tsx
|   |   |   |   +-- transaction-history.tsx
|   |   |   +-- chat/                # Chat interface components
|   |   |   |   +-- bridge-plan-card.tsx
|   |   |   |   +-- chat-container.tsx
|   |   |   |   +-- chat-input.tsx
|   |   |   |   +-- message-bubble.tsx
|   |   |   +-- icons/               # Blockchain icons
|   |   |   |   +-- chain-icons.tsx
|   |   |   +-- ui/                  # Shadcn UI components
|   |   |   +-- balance-panel.tsx    # Multi-chain balance display
|   |   |   +-- bridge-quote-card.tsx
|   |   +-- hooks/
|   |   |   +-- use-bridge.ts        # Bridge operation hooks
|   |   |   +-- use-toast.ts         # Toast notifications
|   |   +-- lib/
|   |   |   +-- queryClient.ts       # TanStack Query setup
|   |   |   +-- wallet-context.tsx   # NEAR Wallet integration
|   |   +-- pages/
|   |   |   +-- ghostbridge.tsx      # Main unified page (9 workflows)
|   |   +-- App.tsx                  # Application root
|   |   +-- index.css                # Global styles
+-- server/                          # Backend Express server
|   +-- balance-service.ts           # Multi-chain balance fetching
|   +-- bridge-service.ts            # Bridge protocol integration
|   +-- gemini.ts                    # Gemini AI with function calling
|   +-- routes.ts                    # API endpoints
|   +-- storage.ts                   # In-memory data storage
|   +-- index.ts                     # Server entry point
+-- shared/                          # Shared types and schemas
|   +-- schema.ts                    # Zod schemas for all data types
+-- design_guidelines.md             # UI/UX design system
+-- tailwind.config.ts               # Tailwind configuration
+-- vite.config.ts                   # Vite build configuration
```

---

## API Reference

### Chat Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/chat` | POST | Send message to AI with workflow context |
| `/api/chat/history` | GET | Get chat history for session |
| `/api/chat/history` | DELETE | Clear chat history |

### Bridge Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/bridge/plan` | GET | Get current bridge plan |
| `/api/bridge/quote` | POST | Get bridge quote for parameters |
| `/api/bridge/quotes` | POST | Get multiple quotes for comparison |
| `/api/bridge/execute` | POST | Execute a bridge transaction |
| `/api/bridge/execution/:id` | GET | Get execution status |
| `/api/bridge/history` | GET | Get bridge history for wallet |

### Balance Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/balances` | GET | Get balances for connected wallet |
| `/api/health` | GET | Health check |

---

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `GEMINI_API_KEY` | Google Gemini API key | Yes |
| `SESSION_SECRET` | Express session secret | Yes |

---

## Gemini AI Function Calling

The platform uses Gemini's function calling capability to execute backend operations based on natural language input.

### Function Declaration Structure

```typescript
// server/gemini.ts
const FUNCTION_DECLARATIONS: FunctionDeclaration[] = [
  {
    name: "create_bridge_quote",
    description: "Create a bridge quote for transferring tokens",
    parameters: {
      type: Type.OBJECT,
      properties: {
        sourceChain: { type: Type.STRING },
        targetChain: { type: Type.STRING },
        amount: { type: Type.STRING },
        isShielded: { type: Type.BOOLEAN }
      },
      required: ["sourceChain", "targetChain", "amount"]
    }
  },
  // ... more functions
];
```

### Workflow-Specific Prompts

Each workflow has a customized system prompt that guides the AI's behavior:

```typescript
// server/gemini.ts
const WORKFLOW_PROMPTS: Record<Workflow, string> = {
  ghostbridge: "You are GhostBridge AI, specializing in cross-chain bridging...",
  shadowtrader: "You are ShadowTrader AI, an expert in private DeFi trading...",
  enigma: "You are EnigmaAI, specializing in privacy-preserving computation...",
  // ... more prompts
};
```

---

## Supported Chains

| Chain | Symbol | Balance Check | Bridge Support |
|-------|--------|---------------|----------------|
| Zcash | ZEC | Blockchair API | Primary |
| NEAR Protocol | NEAR | Native RPC | Yes |
| Ethereum | ETH | JSON-RPC | Yes |
| Polygon | MATIC | JSON-RPC | Yes |
| Binance Smart Chain | BNB | - | Bridge Only |
| Avalanche | AVAX | - | Bridge Only |
| Starknet | STRK | - | Bridge Only |
| Mina Protocol | MINA | - | Bridge Only |

---

## Design System

The platform uses a crypto-themed dark mode UI with Zcash gold accents.

| Element | Value |
|---------|-------|
| **Primary Color** | Gold (#F4B728) - Zcash brand |
| **Background** | Dark navy/slate |
| **Typography** | Inter (sans), JetBrains Mono (mono) |
| **Border Radius** | 0.5rem (rounded-md) |
| **Spacing** | Consistent padding system |

Design guidelines are documented in `design_guidelines.md`.

---

## Development

### Prerequisites

- Node.js 18+
- npm or yarn
- Gemini API key

### Running Locally

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

The application runs on port 5000 with hot reload enabled.

### Build for Production

```bash
npm run build
```

---

## Security Features

- **Wallet Gating**: All features require wallet connection
- **Shielded Transactions**: Privacy-preserving transfers using Zcash
- **No Mock Data**: All data from real blockchain APIs
- **Session Management**: Secure session handling
- **Input Validation**: Zod schemas for all API inputs

---

## License

MIT License - See LICENSE file for details.

---

<div align="center">

**Built with privacy in mind**

[Report Bug](https://github.com/your-repo/issues) | [Request Feature](https://github.com/your-repo/issues)

</div>
