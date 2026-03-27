import React, {
  useState,
  createContext,
  useEffect,
  useContext,
  useRef,
} from "react";
import { useFetch } from "./FetchContext";
import { useAuthentification } from "./AuthContext";

interface transaction {
  id?: number;
  isSellOrder?: boolean;
  symbol: string;
  quantity: number;
  valueAtExecution?: number;
  status?: string;
}

interface WalletContext {
  actualiseWallets: (walletId: number) => void;
  actualiseWalletsLines: (walletId: number, wallet?: any) => void;
  actualiseWalletsList: () => void;
  wallets: Array<{
    cash?: number;
    id: number;
    name: string;
    transactions: Array<transaction>;
    user?: { id: number; email: string; isAdmin: boolean };
  }>;
  walletsLines: any;
  selectedId: number;
  selectWallet: (walletId: number) => void;
  valuesCached: { [key: string]: { value: number; date: number } };
  assetsCached: number;
  getPrice: (symbol: string) => Promise<number>;
}

const WalletContext = createContext<WalletContext>({
  actualiseWallets: (walletId: number) => {},
  actualiseWalletsLines: (walletId: number) => {},
  actualiseWalletsList: () => {},
  wallets: [],
  walletsLines: {},
  selectedId: 0,
  selectWallet: (walletId: number) => {},
  valuesCached: {},
  assetsCached: 0,
  getPrice: (symbol: string) => {
    return new Promise((resolve) => resolve(0));
  },
});

const WalletProvider = ({ children }: { children: any }) => {
  const lastSyncRef = useRef<number>(0);
  const fetch = useFetch();
  const { isAuthenticated, user } = useAuthentification();
  const [wallets, setWallets] = useState<any[]>([]);
  const [walletsLines, setWalletsLines] = useState<any>({});
  const [selectedId, setSelectedId] = useState(() => {
    if (typeof window === "undefined") return 0;
    return parseInt(localStorage.getItem("selectedWalletId") || "0", 10);
  });
  const [assetsCached, setAssetsCached] = useState(0);
  const [valuesCached, setValuesCached] = useState<{
    [key: string]: { value: number; date: number };
  }>({});

  const valuesCachedRef = useRef(valuesCached);
  valuesCachedRef.current = valuesCached;
  const selectedIdRef = useRef(selectedId);
  selectedIdRef.current = selectedId;

  useEffect(() => {
    localStorage.setItem("selectedWalletId", String(selectedId));
  }, [selectedId]);

  async function actualiseWallets(walletId: number) {}

  useEffect(() => {
    calculateAssets();
  }, [walletsLines, selectedId, valuesCached]);

// Modifier calculateAssets()
function calculateAssets() {
  let assetsValues = 0;
  if (walletsLines && walletsLines[selectedId]) {
    walletsLines[selectedId]?.forEach(
      (line: { symbol: string; quantity: number }) => {
        if (valuesCached[line.symbol])
          assetsValues += line.quantity * valuesCached[line.symbol].value;
      }
    );
    setAssetsCached(assetsValues);

    // ✅ Synchroniser avec la BDD
    const cash = wallets[selectedId]?.cash || 0;
    const totalValue = cash + assetsValues;
    if (wallets[selectedId]?.id) {
      syncPublicValue(selectedId, totalValue);
    }
  }
}

  function actualiseWalletsLines(walletId: number, wallet: any) {
    let trans: any;

    if (!wallet) {
      if (!walletId) walletId = selectedId;
      if (!wallets[walletId]) return;
      trans = wallets[walletId].transactions;
    } else {
      if (!wallet[walletId] || !wallet[walletId].transactions) return;
      trans = wallet[walletId].transactions;
    }

    getRealLines(trans).then((lines) => {
      setWalletsLines({
        ...walletsLines,
        [walletId]: lines,
      });
      fillLines(lines, walletId);
    });

    if (wallet) calculateAssets();
  }

  async function getRealLines(transactions: any) {
    let acc: any = [];
    transactions.forEach((transaction: any) => {
      if (transaction.status === "EXECUTED") {
        let index = acc.findIndex(
          (item: any) => item.symbol === transaction.symbol
        );
        if (index === -1) {
          acc.push({
            symbol: transaction.symbol,
            quantity: transaction.isSellOrder
              ? -transaction.quantity
              : transaction.quantity,
            valueAtExecution: transaction.isSellOrder
              ? []
              : [{ quantity: transaction.quantity, price: transaction.valueAtExecution }],
          });
        } else {
          acc[index].quantity += transaction.isSellOrder
            ? -transaction.quantity
            : transaction.quantity;
          if (!transaction.isSellOrder) {
            acc[index].valueAtExecution.push({
              quantity: transaction.quantity,
              price: transaction.valueAtExecution,
            });
          }
        }
      }
    });
    acc = acc.filter((item: any) => item.quantity > 0.000000001);
    return acc;
  }
  

  async function getPrice(symbol: string): Promise<number> {
    try {
      if (
        valuesCachedRef.current[symbol] &&
        valuesCachedRef.current[symbol].date > Date.now() - 5000
      ) {
        return valuesCachedRef.current[symbol].value;
      }

      const response: any = await fetch.get("/api/stock/lastPrice?symbol=" + symbol);
      let validPrice = 0;
      if (typeof response === "number") {
        validPrice = response;
      } else if (response?.results?.length > 0 && response.results[0].price) {
        validPrice = response.results[0].price;
      } else if (response?.price) {
        validPrice = response.price;
      }

      setValuesCached((prev) => ({
        ...prev,
        [symbol]: { value: validPrice, date: Date.now() },
      }));
      return validPrice;
    } catch (error) {
      return 0;
    }
  }

  async function fillLines(lines: any, walletId: number) {
    lines.forEach((transaction: any) => {
      getPrice(transaction.symbol);
    });
  }

  async function selectWallet(walletId: number) {
    if (walletId === selectedId) return;
    setSelectedId(walletId);
    actualiseWallets(walletId);
    refreshWallets(walletId);
  }

  async function refreshWallets(walletId: number | null = null) {
    const id = walletId ?? selectedIdRef.current;
    const isAdmin = (user as any)?.isAdmin || (user as any)?.admin;
    const endpoint = isAdmin ? "/api/admin/wallets" : "/api/wallet";
    const userWallets = await fetch.get(endpoint);
    setWallets(userWallets);
    actualiseWalletsLines(id, userWallets);
  }

  useEffect(() => {
    if (!isAuthenticated || !user) return;
    const interval = setInterval(() => {
      refreshWallets();
    }, 4000);
    return () => clearInterval(interval);
  }, [isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated || !user) return;
    refreshWallets();
  }, [isAuthenticated]);

  // Ajouter cette fonction dans WalletProvider
async function syncPublicValue(walletId: number, totalValue: number) {
  const now = Date.now();
  if (now - lastSyncRef.current < 30000) return; // ✅ Max 1 sync toutes les 30s
  lastSyncRef.current = now;

  try {
    await fetch.post("/api/wallet/updatePublicValue", {
      walletId: wallets[walletId]?.id,
      value: totalValue,
    });
  } catch (error) {
    console.error("Erreur sync publicWalletValue:", error);
  }
}

  return (
    <WalletContext.Provider
      value={{
        actualiseWallets,
        actualiseWalletsLines,
        actualiseWalletsList: refreshWallets,
        wallets,
        walletsLines,
        selectedId,
        selectWallet,
        valuesCached,
        assetsCached,
        getPrice,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
};

const useWallet = () => useContext(WalletContext);
export { WalletProvider, useWallet };