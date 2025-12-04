interface ChainBalance {
  chain: string;
  symbol: string;
  balance: string;
  usdValue: string;
  lastUpdated: string;
}

interface BalanceResponse {
  balances: ChainBalance[];
  totalUsdValue: string;
}

const CHAIN_CONFIGS = {
  zcash: {
    symbol: "ZEC",
    explorerApi: "https://api.blockchair.com/zcash",
    decimals: 8,
    usdPrice: 35.0,
  },
  near: {
    symbol: "NEAR",
    rpcUrl: "https://rpc.testnet.near.org",
    decimals: 24,
    usdPrice: 5.5,
  },
  ethereum: {
    symbol: "ETH",
    rpcUrl: "https://eth-mainnet.public.blastapi.io",
    decimals: 18,
    usdPrice: 3500.0,
  },
  polygon: {
    symbol: "MATIC",
    rpcUrl: "https://polygon-rpc.com",
    decimals: 18,
    usdPrice: 0.85,
  },
};

async function fetchZcashBalance(address: string): Promise<ChainBalance> {
  try {
    const response = await fetch(
      `https://api.blockchair.com/zcash/dashboards/address/${address}`
    );
    
    if (!response.ok) {
      throw new Error("Zcash API error");
    }
    
    const data = await response.json();
    const balanceSatoshis = data.data?.[address]?.address?.balance || 0;
    const balance = (balanceSatoshis / 1e8).toFixed(8);
    const usdValue = (parseFloat(balance) * CHAIN_CONFIGS.zcash.usdPrice).toFixed(2);
    
    return {
      chain: "zcash",
      symbol: "ZEC",
      balance,
      usdValue: `$${usdValue}`,
      lastUpdated: new Date().toISOString(),
    };
  } catch (error) {
    console.error("Error fetching Zcash balance:", error);
    return {
      chain: "zcash",
      symbol: "ZEC",
      balance: "0.00000000",
      usdValue: "$0.00",
      lastUpdated: new Date().toISOString(),
    };
  }
}

async function fetchNearBalance(accountId: string): Promise<ChainBalance> {
  try {
    const response = await fetch(CHAIN_CONFIGS.near.rpcUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: "dontcare",
        method: "query",
        params: {
          request_type: "view_account",
          finality: "final",
          account_id: accountId,
        },
      }),
    });
    
    if (!response.ok) {
      throw new Error("NEAR RPC error");
    }
    
    const data = await response.json();
    
    if (data.error) {
      throw new Error(data.error.message || "NEAR RPC error");
    }
    
    const amountYocto = data.result?.amount || "0";
    const balance = (BigInt(amountYocto) / BigInt(10 ** 24)).toString();
    const balanceFloat = parseFloat(amountYocto) / 1e24;
    const usdValue = (balanceFloat * CHAIN_CONFIGS.near.usdPrice).toFixed(2);
    
    return {
      chain: "near",
      symbol: "NEAR",
      balance: balanceFloat.toFixed(4),
      usdValue: `$${usdValue}`,
      lastUpdated: new Date().toISOString(),
    };
  } catch (error) {
    console.error("Error fetching NEAR balance:", error);
    return {
      chain: "near",
      symbol: "NEAR",
      balance: "0.0000",
      usdValue: "$0.00",
      lastUpdated: new Date().toISOString(),
    };
  }
}

async function fetchEthereumBalance(address: string): Promise<ChainBalance> {
  try {
    const response = await fetch(CHAIN_CONFIGS.ethereum.rpcUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "eth_getBalance",
        params: [address, "latest"],
      }),
    });
    
    if (!response.ok) {
      throw new Error("Ethereum RPC error");
    }
    
    const data = await response.json();
    const balanceWei = BigInt(data.result || "0x0");
    const balanceEth = Number(balanceWei) / 1e18;
    const usdValue = (balanceEth * CHAIN_CONFIGS.ethereum.usdPrice).toFixed(2);
    
    return {
      chain: "ethereum",
      symbol: "ETH",
      balance: balanceEth.toFixed(6),
      usdValue: `$${usdValue}`,
      lastUpdated: new Date().toISOString(),
    };
  } catch (error) {
    console.error("Error fetching Ethereum balance:", error);
    return {
      chain: "ethereum",
      symbol: "ETH",
      balance: "0.000000",
      usdValue: "$0.00",
      lastUpdated: new Date().toISOString(),
    };
  }
}

async function fetchPolygonBalance(address: string): Promise<ChainBalance> {
  try {
    const response = await fetch(CHAIN_CONFIGS.polygon.rpcUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "eth_getBalance",
        params: [address, "latest"],
      }),
    });
    
    if (!response.ok) {
      throw new Error("Polygon RPC error");
    }
    
    const data = await response.json();
    const balanceWei = BigInt(data.result || "0x0");
    const balanceMatic = Number(balanceWei) / 1e18;
    const usdValue = (balanceMatic * CHAIN_CONFIGS.polygon.usdPrice).toFixed(2);
    
    return {
      chain: "polygon",
      symbol: "MATIC",
      balance: balanceMatic.toFixed(6),
      usdValue: `$${usdValue}`,
      lastUpdated: new Date().toISOString(),
    };
  } catch (error) {
    console.error("Error fetching Polygon balance:", error);
    return {
      chain: "polygon",
      symbol: "MATIC",
      balance: "0.000000",
      usdValue: "$0.00",
      lastUpdated: new Date().toISOString(),
    };
  }
}

export async function fetchAllBalances(addresses: {
  zcash?: string;
  near?: string;
  ethereum?: string;
  polygon?: string;
}): Promise<BalanceResponse> {
  const balancePromises: Promise<ChainBalance>[] = [];
  
  if (addresses.zcash) {
    balancePromises.push(fetchZcashBalance(addresses.zcash));
  }
  if (addresses.near) {
    balancePromises.push(fetchNearBalance(addresses.near));
  }
  if (addresses.ethereum) {
    balancePromises.push(fetchEthereumBalance(addresses.ethereum));
  }
  if (addresses.polygon) {
    balancePromises.push(fetchPolygonBalance(addresses.polygon));
  }
  
  const balances = await Promise.all(balancePromises);
  
  const totalUsdValue = balances.reduce((total, b) => {
    const value = parseFloat(b.usdValue.replace("$", "").replace(",", ""));
    return total + (isNaN(value) ? 0 : value);
  }, 0);
  
  return {
    balances,
    totalUsdValue: `$${totalUsdValue.toFixed(2)}`,
  };
}

export { ChainBalance, BalanceResponse, CHAIN_CONFIGS };
