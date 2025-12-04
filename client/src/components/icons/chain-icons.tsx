import type { Chain } from "@shared/schema";

interface ChainIconProps {
  chain: Chain;
  size?: number;
  className?: string;
}

export function ZcashIcon({ size = 24, className = "" }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <circle cx="16" cy="16" r="16" fill="#F4B728" />
      <path
        d="M16 6v3.5M16 22.5V26M14 9.5h4v2h-6l6 9h-6v2h4M14 22.5h4"
        stroke="#231F20"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function EthereumIcon({ size = 24, className = "" }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <circle cx="16" cy="16" r="16" fill="#627EEA" />
      <path d="M16 4v9l7.5 3.5L16 4z" fill="#fff" fillOpacity="0.6" />
      <path d="M16 4l-7.5 12.5L16 13V4z" fill="#fff" />
      <path d="M16 21.5v6.5l7.5-10.5L16 21.5z" fill="#fff" fillOpacity="0.6" />
      <path d="M16 28v-6.5l-7.5-4L16 28z" fill="#fff" />
      <path d="M16 20l7.5-3.5L16 13v7z" fill="#fff" fillOpacity="0.2" />
      <path d="M8.5 16.5L16 20v-7l-7.5 3.5z" fill="#fff" fillOpacity="0.6" />
    </svg>
  );
}

export function NearIcon({ size = 24, className = "" }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <circle cx="16" cy="16" r="16" fill="#000" />
      <path
        d="M21.5 8l-4 7.5 4.5 4.5v-12h-1l-8 12v-12h-1l-1 1v14l1 1h1l4-7.5-4.5-4.5v12h1l8-12v12h2V8h-2z"
        fill="#fff"
      />
    </svg>
  );
}

export function BinanceIcon({ size = 24, className = "" }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <circle cx="16" cy="16" r="16" fill="#F3BA2F" />
      <path
        d="M16 7l3.5 3.5-2.1 2.1-1.4-1.4-1.4 1.4-2.1-2.1L16 7zm-5.5 5.5l2.1 2.1-2.1 2.1-2.1-2.1 2.1-2.1zm11 0l2.1 2.1-2.1 2.1-2.1-2.1 2.1-2.1zM16 14.4l1.6 1.6-1.6 1.6-1.6-1.6 1.6-1.6zm-5.5 3.1l2.1 2.1-2.1 2.1-2.1-2.1 2.1-2.1zm11 0l2.1 2.1-2.1 2.1-2.1-2.1 2.1-2.1zM16 20.9l3.5 3.5L16 28l-3.5-3.5 3.5-3.6z"
        fill="#fff"
      />
    </svg>
  );
}

export function PolygonIcon({ size = 24, className = "" }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <circle cx="16" cy="16" r="16" fill="#8247E5" />
      <path
        d="M21 13.5c-.4-.2-.9-.2-1.3 0l-3 1.7-2 1.1-3 1.7c-.4.2-.9.2-1.3 0l-2.4-1.4c-.4-.2-.6-.6-.6-1.1v-2.7c0-.4.2-.8.6-1l2.4-1.4c.4-.2.9-.2 1.3 0l2.4 1.4c.4.2.6.6.6 1.1v1.7l2-1.1v-1.7c0-.4-.2-.8-.6-1l-4.3-2.5c-.4-.2-.9-.2-1.3 0l-4.4 2.5c-.4.2-.6.6-.6 1v5c0 .4.2.8.6 1l4.4 2.5c.4.2.9.2 1.3 0l3-1.7 2-1.1 3-1.7c.4-.2.9-.2 1.3 0l2.4 1.4c.4.2.6.6.6 1.1v2.7c0 .4-.2.8-.6 1l-2.4 1.4c-.4.2-.9.2-1.3 0l-2.4-1.4c-.4-.2-.6-.6-.6-1.1v-1.7l-2 1.1v1.7c0 .4.2.8.6 1l4.4 2.5c.4.2.9.2 1.3 0l4.4-2.5c.4-.2.6-.6.6-1v-5c0-.4-.2-.8-.6-1L21 13.5z"
        fill="#fff"
      />
    </svg>
  );
}

export function AvalancheIcon({ size = 24, className = "" }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <circle cx="16" cy="16" r="16" fill="#E84142" />
      <path
        d="M20.5 20h-3c-.5 0-.8-.3-1-.6l-3-6c-.2-.3-.2-.7 0-1l1.5-2.5c.2-.3.5-.5.8-.5h.3c.3 0 .6.2.8.5l4.5 8c.2.4.2.8 0 1.1-.2.3-.5.5-.9 1zm-9 0h-3c-.4 0-.8-.2-1-.6-.2-.3-.2-.7 0-1l6-10c.2-.3.5-.5.9-.5.4 0 .7.2.9.5l1.5 2.5c.2.3.2.7 0 1l-4 6.5c-.2.3-.5.6-1.3.6z"
        fill="#fff"
      />
    </svg>
  );
}

export function ChainIcon({ chain, size = 24, className = "" }: ChainIconProps) {
  switch (chain) {
    case "zcash":
      return <ZcashIcon size={size} className={className} />;
    case "ethereum":
      return <EthereumIcon size={size} className={className} />;
    case "near":
      return <NearIcon size={size} className={className} />;
    case "binance":
      return <BinanceIcon size={size} className={className} />;
    case "polygon":
      return <PolygonIcon size={size} className={className} />;
    case "avalanche":
      return <AvalancheIcon size={size} className={className} />;
    default:
      return <ZcashIcon size={size} className={className} />;
  }
}

export function getChainName(chain: Chain): string {
  const names: Record<Chain, string> = {
    zcash: "Zcash",
    ethereum: "Ethereum",
    near: "NEAR",
    binance: "Binance Chain",
    polygon: "Polygon",
    avalanche: "Avalanche",
  };
  return names[chain];
}

export function getChainColor(chain: Chain): string {
  const colors: Record<Chain, string> = {
    zcash: "#F4B728",
    ethereum: "#627EEA",
    near: "#000000",
    binance: "#F3BA2F",
    polygon: "#8247E5",
    avalanche: "#E84142",
  };
  return colors[chain];
}
