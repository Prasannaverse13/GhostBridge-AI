import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useWallet } from "@/lib/wallet-context";
import { 
  Shield, 
  Zap, 
  Lock, 
  ArrowRight, 
  Wallet,
  Sparkles,
  Globe,
  Clock
} from "lucide-react";
import { ZcashIcon, EthereumIcon, NearIcon, PolygonIcon } from "@/components/icons/chain-icons";

interface WelcomeHeroProps {
  onConnect: () => void;
}

export function WelcomeHero({ onConnect }: WelcomeHeroProps) {
  const { isConnecting } = useWallet();

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 md:p-12 overflow-auto">
      <div className="max-w-4xl w-full space-y-12">
        <div className="text-center space-y-6">
          <Badge variant="outline" className="gap-1.5 px-3 py-1">
            <Sparkles className="h-3 w-3 text-primary" />
            AI-Powered Privacy Bridge
          </Badge>

          <div className="space-y-4">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight">
              Bridge Zcash
              <span className="text-primary block mt-2">Privately</span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
              GhostBridge AI lets you move Zcash across chains using natural language. 
              Just tell it what you want, and the AI handles the rest.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Button 
              size="lg" 
              onClick={onConnect}
              disabled={isConnecting}
              className="gap-2 min-w-[200px]"
              data-testid="button-hero-connect"
            >
              <Wallet className="h-5 w-5" />
              {isConnecting ? "Connecting..." : "Connect Wallet"}
            </Button>
            <Button 
              size="lg" 
              variant="outline"
              className="gap-2"
              data-testid="button-learn-more"
            >
              Learn More
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="flex items-center justify-center gap-3 md:gap-6 flex-wrap">
          <ChainBubble icon={<ZcashIcon size={32} />} name="Zcash" />
          <ArrowRight className="h-5 w-5 text-muted-foreground hidden md:block" />
          <ChainBubble icon={<EthereumIcon size={32} />} name="Ethereum" />
          <ChainBubble icon={<NearIcon size={32} />} name="NEAR" />
          <ChainBubble icon={<PolygonIcon size={32} />} name="Polygon" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <FeatureCard
            icon={<Lock className="h-6 w-6" />}
            title="Private Transactions"
            description="All ZEC transfers use shielded pools, keeping your values and addresses hidden"
          />
          <FeatureCard
            icon={<Sparkles className="h-6 w-6" />}
            title="AI-Powered"
            description="Describe your bridge request in plain English - GhostBridge handles the complexity"
          />
          <FeatureCard
            icon={<Zap className="h-6 w-6" />}
            title="Multi-Chain"
            description="Bridge to Ethereum, NEAR, Polygon, and more with optimized routes"
          />
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4">
          <StatCard value="$2.5M+" label="Total Bridged" />
          <StatCard value="<5 min" label="Avg. Bridge Time" />
          <StatCard value="6" label="Supported Chains" />
          <StatCard value="100%" label="Privacy Protected" />
        </div>
      </div>
    </div>
  );
}

function ChainBubble({ icon, name }: { icon: React.ReactNode; name: string }) {
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="h-14 w-14 rounded-xl bg-card border border-card-border flex items-center justify-center hover-elevate transition-all">
        {icon}
      </div>
      <span className="text-xs text-muted-foreground">{name}</span>
    </div>
  );
}

function FeatureCard({ 
  icon, 
  title, 
  description 
}: { 
  icon: React.ReactNode; 
  title: string; 
  description: string;
}) {
  return (
    <div 
      className="p-6 rounded-xl border border-border bg-card/50 space-y-3 hover-elevate transition-all"
      data-testid={`card-feature-${title.toLowerCase().replace(/\s+/g, '-')}`}
    >
      <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
        {icon}
      </div>
      <h3 className="font-semibold">{title}</h3>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  );
}

function StatCard({ value, label }: { value: string; label: string }) {
  return (
    <div 
      className="p-4 rounded-lg border border-border bg-card/30 text-center"
      data-testid={`stat-${label.toLowerCase().replace(/\s+/g, '-')}`}
    >
      <div className="text-2xl font-bold text-primary" data-testid={`text-stat-value-${label.toLowerCase().replace(/\s+/g, '-')}`}>
        {value}
      </div>
      <div className="text-xs text-muted-foreground mt-1">{label}</div>
    </div>
  );
}
