import { createContext, useContext, useState, useCallback, useEffect, useRef, type ReactNode } from "react";
import { setupWalletSelector, type WalletSelector, type Wallet } from "@near-wallet-selector/core";
import { setupModal, type WalletSelectorModal } from "@near-wallet-selector/modal-ui";
import { setupMyNearWallet } from "@near-wallet-selector/my-near-wallet";
import type { WalletState } from "@shared/schema";
import "@near-wallet-selector/modal-ui/styles.css";
import type { Subscription } from "rxjs";

interface WalletContextType {
  wallet: WalletState;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  isConnecting: boolean;
  signTransaction: (receiverId: string, actions: TransactionAction[]) => Promise<TransactionResult | null>;
  signMessage: (message: string) => Promise<SignedMessage | null>;
  getActiveWallet: () => Promise<Wallet | null>;
  fetchBalance: () => Promise<string | null>;
}

export interface TransactionAction {
  type: "FunctionCall";
  params: {
    methodName: string;
    args: Record<string, unknown>;
    gas: string;
    deposit: string;
  };
}

export interface TransactionResult {
  transactionHash: string;
  status: "success" | "failure";
}

export interface SignedMessage {
  signature: string;
  publicKey: string;
  accountId: string;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

const NETWORK = "testnet";
const CONTRACT_ID = "guest-book.testnet";
const RPC_URL = NETWORK === "testnet" 
  ? "https://rpc.testnet.near.org" 
  : "https://rpc.mainnet.near.org";

export function WalletProvider({ children }: { children: ReactNode }) {
  const [wallet, setWallet] = useState<WalletState>({
    isConnected: false,
    network: NETWORK,
  });
  const [isConnecting, setIsConnecting] = useState(false);
  const selectorRef = useRef<WalletSelector | null>(null);
  const modalRef = useRef<WalletSelectorModal | null>(null);
  const initializingRef = useRef(false);
  const subscriptionRef = useRef<Subscription | null>(null);

  const fetchAccountBalance = useCallback(async (accountId: string): Promise<string | null> => {
    try {
      const response = await fetch(RPC_URL, {
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
      
      const data = await response.json();
      if (data.result && data.result.amount) {
        const yoctoNear = BigInt(data.result.amount);
        const nearBalance = Number(yoctoNear) / 1e24;
        return nearBalance.toFixed(4);
      }
      return null;
    } catch (error) {
      console.error("Error fetching balance:", error);
      return null;
    }
  }, []);

  const initializeSelector = useCallback(async () => {
    if (initializingRef.current || selectorRef.current) return;
    
    initializingRef.current = true;
    
    try {
      const selector = await setupWalletSelector({
        network: NETWORK,
        modules: [
          setupMyNearWallet(),
        ],
      });

      selectorRef.current = selector;

      modalRef.current = setupModal(selector, {
        contractId: CONTRACT_ID,
      });

      const accounts = selector.store.getState().accounts;
      if (accounts.length > 0) {
        const account = accounts[0];
        const balance = await fetchAccountBalance(account.accountId);
        setWallet({
          isConnected: true,
          accountId: account.accountId,
          balance: balance || undefined,
          network: NETWORK,
        });
      }

      subscriptionRef.current = selector.store.observable.subscribe(async (state) => {
        const accounts = state.accounts;
        if (accounts.length > 0) {
          const account = accounts[0];
          const balance = await fetchAccountBalance(account.accountId);
          
          setWallet({
            isConnected: true,
            accountId: account.accountId,
            balance: balance || undefined,
            network: NETWORK,
          });
        } else {
          setWallet({
            isConnected: false,
            network: NETWORK,
          });
        }
      });

    } catch (error) {
      console.error("Failed to initialize wallet selector:", error);
    } finally {
      initializingRef.current = false;
    }
  }, [fetchAccountBalance]);

  useEffect(() => {
    initializeSelector();
    
    return () => {
      if (subscriptionRef.current) {
        subscriptionRef.current.unsubscribe();
        subscriptionRef.current = null;
      }
    };
  }, [initializeSelector]);

  const connect = useCallback(async () => {
    setIsConnecting(true);
    try {
      if (!selectorRef.current) {
        await initializeSelector();
      }
      
      if (modalRef.current) {
        modalRef.current.show();
      }
    } catch (error) {
      console.error("Failed to connect wallet:", error);
    } finally {
      setTimeout(() => setIsConnecting(false), 500);
    }
  }, [initializeSelector]);

  const disconnect = useCallback(async () => {
    try {
      if (selectorRef.current) {
        const activeWallet = await selectorRef.current.wallet();
        if (activeWallet) {
          await activeWallet.signOut();
        }
      }
      setWallet({
        isConnected: false,
        network: NETWORK,
      });
    } catch (error) {
      console.error("Failed to disconnect wallet:", error);
    }
  }, []);

  const getActiveWallet = useCallback(async (): Promise<Wallet | null> => {
    if (!selectorRef.current) return null;
    try {
      return await selectorRef.current.wallet();
    } catch {
      return null;
    }
  }, []);

  const fetchBalance = useCallback(async (): Promise<string | null> => {
    if (!wallet.accountId) return null;
    return fetchAccountBalance(wallet.accountId);
  }, [wallet.accountId, fetchAccountBalance]);

  const signTransaction = useCallback(async (
    receiverId: string,
    actions: TransactionAction[]
  ): Promise<TransactionResult | null> => {
    if (!selectorRef.current || !wallet.isConnected) {
      console.error("Wallet not connected");
      return null;
    }

    try {
      const activeWallet = await selectorRef.current.wallet();
      if (!activeWallet) {
        console.error("No active wallet found");
        return null;
      }

      const result = await activeWallet.signAndSendTransaction({
        receiverId,
        actions: actions.map(action => ({
          type: action.type,
          params: action.params,
        })),
      });

      if (result) {
        return {
          transactionHash: typeof result === 'object' && 'transaction' in result 
            ? (result.transaction as { hash: string }).hash 
            : String(result),
          status: "success",
        };
      }
      return null;
    } catch (error) {
      console.error("Transaction signing failed:", error);
      return {
        transactionHash: "",
        status: "failure",
      };
    }
  }, [wallet.isConnected]);

  const signMessage = useCallback(async (message: string): Promise<SignedMessage | null> => {
    if (!selectorRef.current || !wallet.isConnected || !wallet.accountId) {
      console.error("Wallet not connected");
      return null;
    }

    try {
      const activeWallet = await selectorRef.current.wallet();
      if (!activeWallet) {
        console.error("No active wallet found");
        return null;
      }

      if ('signMessage' in activeWallet) {
        const BufferClass = typeof window !== 'undefined' && window.Buffer ? window.Buffer : null;
        if (!BufferClass) {
          console.warn("Buffer not available for message signing");
          return null;
        }
        
        const nonce = BufferClass.from(Date.now().toString());
        const signedMessage = await (activeWallet as Wallet & { 
          signMessage: (params: { message: string; nonce: Uint8Array; recipient: string }) => Promise<{ signature: string; publicKey: string }> 
        }).signMessage({
          message,
          nonce,
          recipient: CONTRACT_ID,
        });

        return {
          signature: signedMessage.signature,
          publicKey: signedMessage.publicKey,
          accountId: wallet.accountId,
        };
      }

      console.warn("Current wallet does not support message signing");
      return null;
    } catch (error) {
      console.error("Message signing failed:", error);
      return null;
    }
  }, [wallet.isConnected, wallet.accountId]);

  return (
    <WalletContext.Provider value={{ 
      wallet, 
      connect, 
      disconnect, 
      isConnecting,
      signTransaction,
      signMessage,
      getActiveWallet,
      fetchBalance,
    }}>
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error("useWallet must be used within a WalletProvider");
  }
  return context;
}
