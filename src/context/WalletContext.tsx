// Create a react context TestContext with TypeScript
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
    return new Promise((resolve, reject) => {
      resolve(0);
    });
  },
});

const WalletProvider = ({ children }: { children: any }) => {
  const fetch = useFetch();
  const { isAuthenticated, user } = useAuthentification();
  const [wallets, setWallets] = useState<
    Array<{
      id: number;
      name: string;
      cash?: number;
      transactions: Array<transaction>;
    }>
  >([]);
  const [walletsLines, setWalletsLines] = useState<any>({});
  const [selectedId, setSelectedId] = useState(0);
  const [assetsCached, setAssetsCached] = useState(0); 
  const [valuesCached, setValuesCached] = useState<{
    [key: string]: { value: number; date: number };
  }>({}); 
  const valuesCachedRef = useRef(valuesCached);
  valuesCachedRef.current = valuesCached;
  async function actualiseWallets(walletId: number) {}

  useEffect(() => {
    calculateAssets();
  }, [walletsLines, selectedId, valuesCached]);

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
    }
  }
  function actualiseWalletsLines(walletId: number, wallet: any) {
    let trans: any;

    if (!wallet) {
      if (!walletId) {
        walletId = selectedId;
      }
      if (!wallets[walletId]) {
        return;
      }
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
              : [
                  {
                    quantity: transaction.quantity,
                    price: transaction.valueAtExecution,
                  },
                ],
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
      valuesCachedRef.current[symbol].date > Date.now() - 10000
    ) {
      return valuesCachedRef.current[symbol].value;
    }

    const response: any = await fetch.get("/api/stock/lastPrice?symbol=" + symbol);
    let validPrice = 0;
    if (typeof response === 'number') {
      validPrice = response;
    } else if (response?.results && response.results.length > 0 && response.results[0].price) {
      validPrice = response.results[0].price; 
    } else if (response?.price) {
      validPrice = response.price; 
    }

    setValuesCached((prev) => {
      return {
        ...prev,
        [symbol]: {
          value: validPrice,
          date: Date.now(),
        },
      };
    });
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
    let id = walletId;
    if (walletId == null) id = selectedId;
    const userWallets = await fetch.get("/api/wallet");
    setWallets(userWallets);
    actualiseWalletsLines(id as number, userWallets);
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
