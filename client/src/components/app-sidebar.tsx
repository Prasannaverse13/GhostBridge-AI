import { useLocation, Link } from "wouter";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeftRight,
  TrendingUp,
  Brain,
  Wallet,
  Code,
  Palette,
  Radio,
  CreditCard,
  BarChart3,
  Shield,
  Zap,
} from "lucide-react";

const workflows = [
  {
    id: "ghostbridge",
    title: "GhostBridge",
    subtitle: "Cross-Chain Bridge",
    description: "Private ZEC bridging",
    icon: ArrowLeftRight,
    path: "/",
    color: "text-amber-400",
    badge: "Bridge",
  },
  {
    id: "shadowtrader",
    title: "ShadowTrader",
    subtitle: "Private DeFi",
    description: "Private trading & swaps",
    icon: TrendingUp,
    path: "/shadowtrader",
    color: "text-emerald-400",
    badge: "DeFi",
  },
  {
    id: "enigma",
    title: "EnigmaAI",
    subtitle: "Private Compute",
    description: "Encrypted AI processing",
    icon: Brain,
    path: "/enigma",
    color: "text-purple-400",
    badge: "AI",
  },
  {
    id: "vault",
    title: "VaultAI",
    subtitle: "Self-Custody",
    description: "Multi-chain wallet",
    icon: Wallet,
    path: "/vault",
    color: "text-blue-400",
    badge: "Wallet",
  },
  {
    id: "shieldcoder",
    title: "ShieldCoder",
    subtitle: "Dev Tools",
    description: "Privacy dev toolkit",
    icon: Code,
    path: "/shieldcoder",
    color: "text-cyan-400",
    badge: "Dev",
  },
  {
    id: "privamuse",
    title: "PrivaMuse",
    subtitle: "Creative Privacy",
    description: "AI art & stories",
    icon: Palette,
    path: "/privamuse",
    color: "text-pink-400",
    badge: "Creative",
  },
  {
    id: "echoprivacy",
    title: "EchoPrivacy",
    subtitle: "Content & Media",
    description: "Privacy news & content",
    icon: Radio,
    path: "/echoprivacy",
    color: "text-orange-400",
    badge: "Media",
  },
  {
    id: "anonpay",
    title: "AnonPay",
    subtitle: "Private Payments",
    description: "Scheduled shielded tx",
    icon: CreditCard,
    path: "/anonpay",
    color: "text-green-400",
    badge: "Payments",
  },
  {
    id: "zinsight",
    title: "ZInsight",
    subtitle: "Analytics",
    description: "Zcash data insights",
    icon: BarChart3,
    path: "/zinsight",
    color: "text-indigo-400",
    badge: "Analytics",
  },
];

export function AppSidebar() {
  const [location] = useLocation();

  return (
    <Sidebar>
      <SidebarHeader className="p-4 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-md bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center">
            <Shield className="w-6 h-6 text-black" />
          </div>
          <div>
            <h1 className="font-bold text-lg text-sidebar-foreground">ZPrivacy</h1>
            <p className="text-xs text-muted-foreground">Unified Privacy Platform</p>
          </div>
        </div>
      </SidebarHeader>
      
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs uppercase tracking-wider text-muted-foreground px-4">
            Workflows
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {workflows.map((workflow) => {
                const isActive = location === workflow.path;
                const Icon = workflow.icon;
                
                return (
                  <SidebarMenuItem key={workflow.id}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      className="h-auto py-3"
                      data-testid={`nav-${workflow.id}`}
                    >
                      <Link href={workflow.path}>
                        <div className="flex items-start gap-3 w-full">
                          <div className={`mt-0.5 ${workflow.color}`}>
                            <Icon className="w-5 h-5" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-sm">{workflow.title}</span>
                              <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                                {workflow.badge}
                              </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground truncate">
                              {workflow.description}
                            </p>
                          </div>
                        </div>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4 border-t border-sidebar-border">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Zap className="w-4 h-4 text-amber-400" />
          <span>Powered by Zcash Privacy</span>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
