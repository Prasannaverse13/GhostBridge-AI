import { useState, useCallback, useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useWallet } from "@/lib/wallet-context";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { ChatMessage, ChatResponse, BridgePlan, Transaction, FunctionCall } from "@shared/schema";
import {
  ArrowLeftRight,
  TrendingUp,
  TrendingDown,
  Brain,
  Wallet as WalletIcon,
  Code,
  Palette,
  Radio,
  CreditCard,
  BarChart3,
  Shield,
  RefreshCw,
  Send,
  Lock,
  Zap,
  Activity,
  Eye,
  EyeOff,
  Clock,
  Plus,
  Trash2,
  Play,
  Pause,
  Check,
  Database,
  LineChart,
  Sparkles,
  FileText,
  Image,
  MessageSquare,
  ArrowRightLeft,
  Copy,
  ExternalLink,
  LogOut,
} from "lucide-react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import { Line, Bar } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

type WorkflowId = 
  | "ghostbridge" 
  | "shadowtrader" 
  | "enigma" 
  | "vault" 
  | "shieldcoder" 
  | "privamuse" 
  | "echoprivacy" 
  | "anonpay" 
  | "zinsight";

interface WorkflowConfig {
  id: WorkflowId;
  title: string;
  subtitle: string;
  description: string;
  icon: typeof ArrowLeftRight;
  color: string;
  gradientFrom: string;
  gradientTo: string;
  placeholder: string;
}

const WORKFLOWS: WorkflowConfig[] = [
  {
    id: "ghostbridge",
    title: "GhostBridge",
    subtitle: "Cross-Chain Bridge",
    description: "Private ZEC bridging across 8 chains",
    icon: ArrowLeftRight,
    color: "text-amber-400",
    gradientFrom: "from-amber-400",
    gradientTo: "to-amber-600",
    placeholder: "Bridge 1 ETH to Zcash privately...",
  },
  {
    id: "shadowtrader",
    title: "ShadowTrader",
    subtitle: "Private DeFi",
    description: "Private trading with Arcium encryption",
    icon: TrendingUp,
    color: "text-emerald-400",
    gradientFrom: "from-emerald-400",
    gradientTo: "to-emerald-600",
    placeholder: "Swap 1 ZEC for USDC privately...",
  },
  {
    id: "enigma",
    title: "EnigmaAI",
    subtitle: "Private Compute",
    description: "Homomorphic encryption processing",
    icon: Brain,
    color: "text-purple-400",
    gradientFrom: "from-purple-400",
    gradientTo: "to-purple-600",
    placeholder: "Encrypt my data with Paillier...",
  },
  {
    id: "vault",
    title: "VaultAI",
    subtitle: "Self-Custody",
    description: "Multi-chain wallet management",
    icon: WalletIcon,
    color: "text-blue-400",
    gradientFrom: "from-blue-400",
    gradientTo: "to-blue-600",
    placeholder: "Show my balances across all chains...",
  },
  {
    id: "shieldcoder",
    title: "ShieldCoder",
    subtitle: "Dev Tools",
    description: "ZK development snippets & tools",
    icon: Code,
    color: "text-cyan-400",
    gradientFrom: "from-cyan-400",
    gradientTo: "to-cyan-600",
    placeholder: "Generate ZK proof verification code...",
  },
  {
    id: "privamuse",
    title: "PrivaMuse",
    subtitle: "Creative Privacy",
    description: "Privacy memes, stories & art",
    icon: Palette,
    color: "text-pink-400",
    gradientFrom: "from-pink-400",
    gradientTo: "to-pink-600",
    placeholder: "Create a privacy-themed meme...",
  },
  {
    id: "echoprivacy",
    title: "EchoPrivacy",
    subtitle: "Content & Media",
    description: "Privacy education & news",
    icon: Radio,
    color: "text-orange-400",
    gradientFrom: "from-orange-400",
    gradientTo: "to-orange-600",
    placeholder: "Write an article about Zcash privacy...",
  },
  {
    id: "anonpay",
    title: "AnonPay",
    subtitle: "Private Payments",
    description: "Scheduled shielded transactions",
    icon: CreditCard,
    color: "text-green-400",
    gradientFrom: "from-green-400",
    gradientTo: "to-green-600",
    placeholder: "Schedule 0.5 ZEC monthly to zs1...",
  },
  {
    id: "zinsight",
    title: "ZInsight",
    subtitle: "Analytics",
    description: "Zcash blockchain insights",
    icon: BarChart3,
    color: "text-indigo-400",
    gradientFrom: "from-indigo-400",
    gradientTo: "to-indigo-600",
    placeholder: "Analyze Zcash shielded pool trends...",
  },
];

const OTHER_CHAINS = [
  { id: "ethereum", label: "ETH", placeholder: "0x...", validate: (addr: string) => /^0x[a-fA-F0-9]{40}$/.test(addr) },
  { id: "polygon", label: "MATIC", placeholder: "0x...", validate: (addr: string) => /^0x[a-fA-F0-9]{40}$/.test(addr) },
  { id: "zcash", label: "ZEC", placeholder: "t1... or zs1...", validate: (addr: string) => /^(t1|zs1)[a-zA-Z0-9]{33,}$/.test(addr) },
];

const STORAGE_KEY = "ghostbridge_chain_addresses";

export default function GhostBridge() {
  const { wallet, connect, disconnect, fetchBalance } = useWallet();
  const { toast } = useToast();
  const [activeWorkflow, setActiveWorkflow] = useState<WorkflowId>("ghostbridge");
  const [messages, setMessages] = useState<Record<WorkflowId, ChatMessage[]>>({
    ghostbridge: [],
    shadowtrader: [],
    enigma: [],
    vault: [],
    shieldcoder: [],
    privamuse: [],
    echoprivacy: [],
    anonpay: [],
    zinsight: [],
  });
  const [input, setInput] = useState("");
  const [currentPlan, setCurrentPlan] = useState<BridgePlan | undefined>();
  const [balances, setBalances] = useState<Record<string, string>>({});
  const [isLoadingBalances, setIsLoadingBalances] = useState(false);
  const [chainAddresses, setChainAddresses] = useState<Record<string, string>>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  });
  const [showAddressInputs, setShowAddressInputs] = useState(false);
  const [addressErrors, setAddressErrors] = useState<Record<string, string>>({});

  const currentWorkflow = WORKFLOWS.find(w => w.id === activeWorkflow)!;

  const { data: transactionsData, refetch: refetchTransactions } = useQuery<{ transactions: Transaction[] }>({
    queryKey: ["/api/transactions"],
    enabled: wallet.isConnected,
  });

  const fetchBalances = useCallback(async () => {
    if (!wallet.isConnected || !wallet.accountId) return;
    
    setIsLoadingBalances(true);
    try {
      const params = new URLSearchParams();
      params.set("near", wallet.accountId);
      
      const storedAddresses = (() => {
        try {
          const stored = localStorage.getItem(STORAGE_KEY);
          return stored ? JSON.parse(stored) : {};
        } catch {
          return {};
        }
      })();
      
      for (const chain of OTHER_CHAINS) {
        const addr = storedAddresses[chain.id];
        if (addr && chain.validate(addr)) {
          params.set(chain.id, addr);
        }
      }
      
      const response = await fetch(`/api/balances?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        if (data.balances) {
          const balanceMap: Record<string, string> = {};
          for (const b of data.balances) {
            balanceMap[b.chain] = b.balance;
          }
          setBalances(balanceMap);
        }
      }
    } catch (error) {
      console.error("Error fetching balances:", error);
    } finally {
      setIsLoadingBalances(false);
    }
  }, [wallet.isConnected, wallet.accountId]);

  useEffect(() => {
    if (wallet.isConnected) {
      fetchBalances();
    }
  }, [wallet.isConnected, fetchBalances]);

  const handleFunctionCall = useCallback((functionCall: FunctionCall) => {
    switch (functionCall.name) {
      case "check_balance":
        toast({
          title: "Balance Check",
          description: "Your balances are displayed in the dashboard.",
        });
        fetchBalances();
        break;
      case "create_bridge_quote":
        toast({
          title: "Bridge Quote Ready",
          description: "Review the quote details in the response.",
        });
        break;
      case "execute_private_trade":
        toast({
          title: "Trade Submitted",
          description: "Your private trade is being processed.",
        });
        break;
      case "encrypt_data":
        toast({
          title: "Data Encrypted",
          description: "Homomorphic encryption complete.",
        });
        break;
      case "generate_privacy_code":
        toast({
          title: "Code Generated",
          description: "Your privacy code snippet is ready.",
        });
        break;
      case "schedule_payment":
        toast({
          title: "Payment Scheduled",
          description: "Your private payment has been scheduled.",
        });
        break;
      case "analyze_zcash_metrics":
        toast({
          title: "Analysis Complete",
          description: "Zcash metrics analysis is ready.",
        });
        break;
      default:
        console.log("Function call:", functionCall);
    }
  }, [toast, fetchBalances]);

  const chatMutation = useMutation({
    mutationFn: async (message: string) => {
      const walletHeaders: Record<string, string> = {};
      if (wallet.isConnected && wallet.accountId) {
        walletHeaders["x-wallet-address"] = wallet.accountId;
        walletHeaders["x-wallet-chain"] = "near";
      }

      const response = await apiRequest("POST", "/api/chat", {
        message,
        workflow: activeWorkflow,
        conversationHistory: messages[activeWorkflow].map(m => ({
          role: m.role,
          content: m.content,
        })),
      }, walletHeaders);
      return await response.json() as ChatResponse;
    },
    onSuccess: (data) => {
      setMessages(prev => ({
        ...prev,
        [activeWorkflow]: [...prev[activeWorkflow], data.message],
      }));
      if (data.bridgePlan) {
        setCurrentPlan(data.bridgePlan);
      }
      if (data.functionCall) {
        handleFunctionCall(data.functionCall);
      }
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to process request",
        variant: "destructive",
      });
    },
  });

  const handleSendMessage = useCallback(() => {
    if (!input.trim()) return;
    const userMessage: ChatMessage = {
      id: `msg-${Date.now()}`,
      role: "user",
      content: input,
      timestamp: new Date().toISOString(),
    };
    setMessages(prev => ({
      ...prev,
      [activeWorkflow]: [...prev[activeWorkflow], userMessage],
    }));
    chatMutation.mutate(input);
    setInput("");
  }, [input, chatMutation, activeWorkflow]);

  const handleConnect = useCallback(async () => {
    await connect();
  }, [connect]);

  const copyToClipboard = useCallback((text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Copied to clipboard" });
  }, [toast]);

  if (!wallet.isConnected) {
    return (
      <div className="min-h-screen flex flex-col bg-background flex-1 w-full">
        <div className="flex-1 flex items-center justify-center p-8">
          <Card className="max-w-lg w-full text-center">
            <CardHeader className="text-center pb-2">
              <div className="w-20 h-20 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center mx-auto mb-4">
                <Shield className="w-10 h-10 text-black" />
              </div>
              <CardTitle className="text-2xl">Welcome to GhostBridge AI</CardTitle>
              <CardDescription className="text-base mt-2">
                Your unified privacy platform with 9 specialized AI workflows
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-3 gap-3">
                {WORKFLOWS.slice(0, 9).map((workflow) => {
                  const Icon = workflow.icon;
                  return (
                    <div
                      key={workflow.id}
                      className="flex flex-col items-center p-3 rounded-lg bg-muted/50 text-center"
                    >
                      <div className={`w-8 h-8 rounded-md bg-gradient-to-br ${workflow.gradientFrom} ${workflow.gradientTo} flex items-center justify-center mb-2`}>
                        <Icon className="w-4 h-4 text-white" />
                      </div>
                      <span className="text-xs font-medium">{workflow.title}</span>
                    </div>
                  );
                })}
              </div>
              
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground text-center">
                  Connect your wallet to access all features
                </p>
                <Button 
                  className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-black font-semibold" 
                  size="lg"
                  onClick={handleConnect}
                  data-testid="button-connect-wallet"
                >
                  <WalletIcon className="w-5 h-5 mr-2" />
                  Connect Wallet
                </Button>
                <p className="text-xs text-muted-foreground text-center">
                  Supports NEAR wallets (Meteor, HOT, MyNEAR, Ledger, and more)
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const currentMessages = messages[activeWorkflow];

  return (
    <div className="flex-1 w-full flex flex-col h-full overflow-hidden bg-background">
      <div className="p-4 border-b border-border shrink-0">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-md bg-gradient-to-br ${currentWorkflow.gradientFrom} ${currentWorkflow.gradientTo} flex items-center justify-center`}>
              <currentWorkflow.icon className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold">{currentWorkflow.title}</h1>
              <p className="text-sm text-muted-foreground">{currentWorkflow.description}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="outline" className="text-amber-400 border-amber-400/50">
              <Shield className="w-3 h-3 mr-1" />
              Shielded
            </Badge>
            <Badge variant="outline" className="text-emerald-400 border-emerald-400/50">
              <Activity className="w-3 h-3 mr-1" />
              Connected
            </Badge>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-muted/50">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-sm font-mono truncate max-w-32">
                {wallet.accountId?.slice(0, 12)}...
              </span>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-6 w-6"
                onClick={() => copyToClipboard(wallet.accountId || "")}
                data-testid="button-copy-address"
              >
                <Copy className="w-3 h-3" />
              </Button>
            </div>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={disconnect}
              className="text-muted-foreground"
              data-testid="button-logout"
            >
              <LogOut className="w-4 h-4 mr-1" />
              Logout
            </Button>
          </div>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        <div className="w-64 border-r border-border p-4 space-y-4 overflow-y-auto shrink-0 hidden lg:block">
          <div>
            <h3 className="text-xs font-medium text-muted-foreground uppercase mb-3">Workflows</h3>
            <div className="space-y-1">
              {WORKFLOWS.map((workflow) => {
                const Icon = workflow.icon;
                const isActive = activeWorkflow === workflow.id;
                return (
                  <button
                    key={workflow.id}
                    onClick={() => setActiveWorkflow(workflow.id)}
                    className={`w-full flex items-center gap-3 p-2.5 rounded-md transition-colors ${
                      isActive 
                        ? "bg-muted" 
                        : "hover-elevate"
                    }`}
                    data-testid={`workflow-${workflow.id}`}
                  >
                    <div className={`w-8 h-8 rounded-md bg-gradient-to-br ${workflow.gradientFrom} ${workflow.gradientTo} flex items-center justify-center shrink-0`}>
                      <Icon className="w-4 h-4 text-white" />
                    </div>
                    <div className="text-left min-w-0">
                      <div className="text-sm font-medium truncate">{workflow.title}</div>
                      <div className="text-xs text-muted-foreground truncate">{workflow.subtitle}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="border-t border-border pt-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-medium text-muted-foreground uppercase">
                Balances
              </h3>
              <div className="flex items-center gap-1">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-5 w-5"
                  onClick={() => setShowAddressInputs(!showAddressInputs)}
                  data-testid="button-toggle-addresses"
                >
                  <Plus className={`w-3 h-3 transition-transform ${showAddressInputs ? "rotate-45" : ""}`} />
                </Button>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-5 w-5"
                  onClick={fetchBalances}
                  disabled={isLoadingBalances}
                  data-testid="button-refresh-balances"
                >
                  <RefreshCw className={`w-3 h-3 ${isLoadingBalances ? "animate-spin" : ""}`} />
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm p-2 rounded-md bg-muted/30">
                <span className="uppercase text-xs font-medium">NEAR</span>
                <span className="font-mono text-xs">
                  {balances.near || "0.00"}
                </span>
              </div>
              {OTHER_CHAINS.map((chain) => (
                chainAddresses[chain.id] && (
                  <div key={chain.id} className="flex items-center justify-between text-sm p-2 rounded-md bg-muted/30">
                    <span className="uppercase text-xs font-medium">{chain.label}</span>
                    <span className="font-mono text-xs">
                      {balances[chain.id] || "0.00"}
                    </span>
                  </div>
                )
              ))}
              {showAddressInputs && (
                <div className="space-y-2 pt-2">
                  <p className="text-xs text-muted-foreground">Add addresses for other chains:</p>
                  {OTHER_CHAINS.map((chain) => (
                    <div key={chain.id} className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium w-10">{chain.label}</span>
                        <Input 
                          placeholder={chain.placeholder}
                          value={chainAddresses[chain.id] || ""}
                          onChange={(e) => {
                            const value = e.target.value;
                            setChainAddresses(prev => ({ ...prev, [chain.id]: value }));
                            if (value && !chain.validate(value)) {
                              setAddressErrors(prev => ({ ...prev, [chain.id]: "Invalid address format" }));
                            } else {
                              setAddressErrors(prev => {
                                const { [chain.id]: _, ...rest } = prev;
                                return rest;
                              });
                            }
                          }}
                          className={`h-7 text-xs font-mono ${addressErrors[chain.id] ? "border-destructive" : ""}`}
                          data-testid={`input-address-${chain.id}`}
                        />
                      </div>
                      {addressErrors[chain.id] && (
                        <p className="text-xs text-destructive pl-12">{addressErrors[chain.id]}</p>
                      )}
                    </div>
                  ))}
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full"
                    onClick={() => {
                      const validAddresses: Record<string, string> = {};
                      for (const chain of OTHER_CHAINS) {
                        const addr = chainAddresses[chain.id];
                        if (addr && chain.validate(addr)) {
                          validAddresses[chain.id] = addr;
                        }
                      }
                      localStorage.setItem(STORAGE_KEY, JSON.stringify(validAddresses));
                      setChainAddresses(prev => ({ ...prev, ...validAddresses }));
                      fetchBalances();
                      setShowAddressInputs(false);
                      toast({ title: "Addresses saved" });
                    }}
                    disabled={Object.keys(addressErrors).length > 0}
                    data-testid="button-save-addresses"
                  >
                    Save & Fetch Balances
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <div className="lg:hidden p-2 border-b border-border shrink-0">
            <ScrollArea className="w-full">
              <div className="flex gap-2 pb-2">
                {WORKFLOWS.map((workflow) => {
                  const Icon = workflow.icon;
                  const isActive = activeWorkflow === workflow.id;
                  return (
                    <button
                      key={workflow.id}
                      onClick={() => setActiveWorkflow(workflow.id)}
                      className={`flex items-center gap-2 px-3 py-2 rounded-md whitespace-nowrap ${
                        isActive 
                          ? "bg-muted" 
                          : "hover-elevate"
                      }`}
                      data-testid={`mobile-workflow-${workflow.id}`}
                    >
                      <Icon className={`w-4 h-4 ${workflow.color}`} />
                      <span className="text-sm font-medium">{workflow.title}</span>
                    </button>
                  );
                })}
              </div>
            </ScrollArea>
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            {currentMessages.length === 0 ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center max-w-md">
                  <div className={`w-16 h-16 rounded-xl bg-gradient-to-br ${currentWorkflow.gradientFrom} ${currentWorkflow.gradientTo} flex items-center justify-center mx-auto mb-4`}>
                    <currentWorkflow.icon className="w-8 h-8 text-white" />
                  </div>
                  <h2 className="text-xl font-bold mb-2">{currentWorkflow.title}</h2>
                  <p className="text-muted-foreground mb-6">{currentWorkflow.description}</p>
                  
                  <div className="grid grid-cols-2 gap-3">
                    {activeWorkflow === "ghostbridge" && (
                      <>
                        <Button variant="outline" onClick={() => setInput("Bridge 1 ETH to Zcash with privacy")} data-testid="quick-bridge">
                          <ArrowLeftRight className="w-4 h-4 mr-2" />
                          Bridge ETH
                        </Button>
                        <Button variant="outline" onClick={() => setInput("Check my balances across all chains")} data-testid="quick-balance">
                          <WalletIcon className="w-4 h-4 mr-2" />
                          Check Balances
                        </Button>
                      </>
                    )}
                    {activeWorkflow === "shadowtrader" && (
                      <>
                        <Button variant="outline" onClick={() => setInput("Swap 1 ZEC for USDC privately")} data-testid="quick-swap">
                          <ArrowRightLeft className="w-4 h-4 mr-2" />
                          Private Swap
                        </Button>
                        <Button variant="outline" onClick={() => setInput("Analyze ZEC market trends")} data-testid="quick-analyze">
                          <TrendingUp className="w-4 h-4 mr-2" />
                          Market Analysis
                        </Button>
                      </>
                    )}
                    {activeWorkflow === "enigma" && (
                      <>
                        <Button variant="outline" onClick={() => setInput("Encrypt this data: [sensitive info]")} data-testid="quick-encrypt">
                          <Lock className="w-4 h-4 mr-2" />
                          Encrypt Data
                        </Button>
                        <Button variant="outline" onClick={() => setInput("Perform homomorphic addition on encrypted values")} data-testid="quick-compute">
                          <Brain className="w-4 h-4 mr-2" />
                          Compute
                        </Button>
                      </>
                    )}
                    {activeWorkflow === "vault" && (
                      <>
                        <Button variant="outline" onClick={() => setInput("Show all my wallet balances")} data-testid="quick-balances">
                          <WalletIcon className="w-4 h-4 mr-2" />
                          View Balances
                        </Button>
                        <Button variant="outline" onClick={() => setInput("Generate a new shielded address")} data-testid="quick-address">
                          <Shield className="w-4 h-4 mr-2" />
                          New Address
                        </Button>
                      </>
                    )}
                    {activeWorkflow === "shieldcoder" && (
                      <>
                        <Button variant="outline" onClick={() => setInput("Generate ZK proof verification code in Rust")} data-testid="quick-code">
                          <Code className="w-4 h-4 mr-2" />
                          ZK Code
                        </Button>
                        <Button variant="outline" onClick={() => setInput("Create a privacy smart contract template")} data-testid="quick-contract">
                          <FileText className="w-4 h-4 mr-2" />
                          Contract
                        </Button>
                      </>
                    )}
                    {activeWorkflow === "privamuse" && (
                      <>
                        <Button variant="outline" onClick={() => setInput("Create a privacy-themed meme about ZEC")} data-testid="quick-meme">
                          <Image className="w-4 h-4 mr-2" />
                          Create Meme
                        </Button>
                        <Button variant="outline" onClick={() => setInput("Write a short story about crypto privacy")} data-testid="quick-story">
                          <Sparkles className="w-4 h-4 mr-2" />
                          Write Story
                        </Button>
                      </>
                    )}
                    {activeWorkflow === "echoprivacy" && (
                      <>
                        <Button variant="outline" onClick={() => setInput("Write an article about Zcash privacy features")} data-testid="quick-article">
                          <FileText className="w-4 h-4 mr-2" />
                          Write Article
                        </Button>
                        <Button variant="outline" onClick={() => setInput("Summarize latest privacy news")} data-testid="quick-news">
                          <Radio className="w-4 h-4 mr-2" />
                          Privacy News
                        </Button>
                      </>
                    )}
                    {activeWorkflow === "anonpay" && (
                      <>
                        <Button variant="outline" onClick={() => setInput("Schedule 0.5 ZEC monthly payment to zs1...")} data-testid="quick-schedule">
                          <Clock className="w-4 h-4 mr-2" />
                          Schedule
                        </Button>
                        <Button variant="outline" onClick={() => setInput("Show my scheduled payments")} data-testid="quick-view">
                          <CreditCard className="w-4 h-4 mr-2" />
                          View Payments
                        </Button>
                      </>
                    )}
                    {activeWorkflow === "zinsight" && (
                      <>
                        <Button variant="outline" onClick={() => setInput("Analyze Zcash shielded pool adoption")} data-testid="quick-analyze-pool">
                          <BarChart3 className="w-4 h-4 mr-2" />
                          Pool Analysis
                        </Button>
                        <Button variant="outline" onClick={() => setInput("Show ZEC price trends and predictions")} data-testid="quick-price">
                          <LineChart className="w-4 h-4 mr-2" />
                          Price Trends
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4 max-w-3xl mx-auto">
                {currentMessages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[85%] rounded-lg p-4 ${
                        msg.role === "user"
                          ? `bg-gradient-to-br ${currentWorkflow.gradientFrom}/20 ${currentWorkflow.gradientTo}/20`
                          : "bg-card border border-border"
                      }`}
                    >
                      <div className="whitespace-pre-wrap">{msg.content}</div>
                      <div className="text-xs text-muted-foreground mt-2">
                        {new Date(msg.timestamp).toLocaleTimeString()}
                      </div>
                    </div>
                  </div>
                ))}
                {chatMutation.isPending && (
                  <div className="flex justify-start">
                    <div className="bg-card border border-border rounded-lg p-4">
                      <div className="flex items-center gap-2">
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span className="text-sm text-muted-foreground">Processing...</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="p-4 border-t border-border shrink-0">
            <div className="flex gap-3 max-w-3xl mx-auto">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSendMessage()}
                placeholder={currentWorkflow.placeholder}
                className="flex-1"
                data-testid="input-message"
              />
              <Button
                onClick={handleSendMessage}
                disabled={chatMutation.isPending || !input.trim()}
                className={`bg-gradient-to-r ${currentWorkflow.gradientFrom} ${currentWorkflow.gradientTo} text-white`}
                data-testid="button-send"
              >
                {chatMutation.isPending ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>
        </div>

        <div className="w-80 border-l border-border p-4 overflow-y-auto shrink-0 hidden xl:block">
          {activeWorkflow === "ghostbridge" && currentPlan && (
            <Card className="mb-4">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <ArrowLeftRight className="w-4 h-4 text-amber-400" />
                  Bridge Plan
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">From</span>
                  <span className="font-medium uppercase">{currentPlan.sourceChain}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">To</span>
                  <span className="font-medium uppercase">{currentPlan.targetChain}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Amount</span>
                  <span className="font-medium">{currentPlan.amount}</span>
                </div>
                {currentPlan.estimatedFees && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Fee</span>
                    <span className="font-medium">{currentPlan.estimatedFees.totalUsd}</span>
                  </div>
                )}
                <Button className="w-full mt-2" size="sm" data-testid="button-execute-bridge">
                  <Zap className="w-4 h-4 mr-2" />
                  Execute Bridge
                </Button>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Activity className="w-4 h-4 text-emerald-400" />
                Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              {transactionsData?.transactions && transactionsData.transactions.length > 0 ? (
                <div className="space-y-3">
                  {transactionsData.transactions.slice(0, 5).map((tx) => (
                    <div key={tx.id} className="flex items-center justify-between text-sm p-2 rounded-md bg-muted/30">
                      <div>
                        <div className="font-medium">
                          {tx.sourceChain.toUpperCase()} → {tx.targetChain.toUpperCase()}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {tx.amount}
                        </div>
                      </div>
                      <Badge variant="outline" className={
                        tx.status === "confirmed" ? "text-emerald-400" :
                        tx.status === "pending" ? "text-amber-400" : 
                        tx.status === "processing" ? "text-blue-400" : "text-red-400"
                      }>
                        {tx.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 text-muted-foreground">
                  <Activity className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No recent activity</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="mt-4">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Shield className="w-4 h-4 text-amber-400" />
                Privacy Status
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Encryption</span>
                <Badge variant="outline" className="text-emerald-400">Active</Badge>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Shielded Pool</span>
                <Badge variant="outline" className="text-emerald-400">Connected</Badge>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Network</span>
                <span className="font-mono text-xs">{wallet.network}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
