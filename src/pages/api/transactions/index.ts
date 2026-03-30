import { Status } from "@prisma/client"; 
import { apiHandler } from "../../../helpers/api/api-handler";
import type { NextApiResponse } from "next";
import requestIp from "request-ip";
import { Request } from "../../../types/request.type";
import stockService from "../../../services/stocks/stocks.service";
import transactionsService from "../../../services/transactions/transactions.service";
import walletsService from "../../../services/wallets/wallets.service";

export default apiHandler(transactionByWallet);
function isEuronextOpen(): boolean {
  const now = new Date();
  const parisTime = new Date(now.toLocaleString("en-US", { timeZone: "Europe/Paris" }));
  const day = parisTime.getDay();
  const hours = parisTime.getHours();
  const minutes = parisTime.getMinutes();
  const timeInMinutes = hours * 60 + minutes;
  if (day === 0 || day === 6) return false;
  return timeInMinutes >= 540 && timeInMinutes < 1050; // 9h00 - 17h30
}

async function transactionByWallet(req: Request, res: NextApiResponse<any>) {
  if (req.method !== "POST") {
    throw `Method ${req.method} not allowed`;
  }

  const { amount, adminPrice, walletId, symbol, selling, market } = req.body;

  if (!walletId) throw "Wallet id is required";

  const wallet = await walletsService.find(walletId, true);
  if (!wallet) throw "Wallet not found";
  
  if (wallet?.userId !== req.auth.sub && !req.auth.isAdmin)
    throw "You are not allowed to access this wallet";
  
  if (!amount || (!adminPrice && !symbol))
    throw "Please provide amount and symbol";
  
  if (amount <= 0) throw "Amount must be greater than 0";

  if (adminPrice && req.auth.isAdmin) {
    const result = await walletsService.addMoney(walletId, parseFloat(adminPrice) * parseFloat(amount));
    return res.status(200).json(result);
  }

  const clientIp = requestIp.getClientIp(req);
  const summary: any = await stockService.getLastPrice(symbol, req.auth.sub, clientIp || "");

  if (summary?.results[0]?.error === "NOT_FOUND" || !summary?.results?.length) {
    throw "Unknown symbol";
  }

  const stock = summary.results[0];

  function isNYSEOpen(): boolean {
    const now = new Date();
    const nyTime = new Date(now.toLocaleString("en-US", { timeZone: "America/New_York" }));
    const day = nyTime.getDay();  
    const hours = nyTime.getHours();
    const minutes = nyTime.getMinutes();
    const timeInMinutes = hours * 60 + minutes;
    if (day === 0 || day === 6) return false;
    return timeInMinutes >= 570 && timeInMinutes < 960;
  }

  function isForexOpen(): boolean {
    const now = new Date();
    const day = now.getUTCDay(); 
    const hour = now.getUTCHours();
    if (day === 6) return false;
    if (day === 5 && hour >= 22) return false; 
    if (day === 0 && hour < 22) return false; 
    return true;
  }

  const symbolUpper = symbol.toUpperCase();
  
  const forexPairs = ['EURUSD', 'USDJPY', 'GBPUSD', 'USDCHF', 'AUDUSD', 'USDCAD', 'NZDUSD', 'EURJPY', 'GBPJPY', 'EURGBP'];
  const isForex = (market === "forex" || market === "forex-fx" || forexPairs.includes(symbolUpper));
  const isCrypto = (market === "crypto") || (symbolUpper.endsWith("USD") && !forexPairs.includes(symbolUpper));

const europeanSuffixes = ['.PA', '.AS', '.BR', '.MI', '.MC', '.DE', '.L', '.SW'];
const isEuropean = europeanSuffixes.some(suffix => symbolUpper.endsWith(suffix));

let isMarketOpen = false;

if (isCrypto) {
  isMarketOpen = true;
} else if (isForex) {
  isMarketOpen = isForexOpen();
} else if (isEuropean) {
  isMarketOpen = isEuronextOpen();
} else {
  isMarketOpen = isNYSEOpen();
}
  if (!wallet.id) throw new Error("Wallet ID missing");

  const transaction = await transactionsService.create(
    selling === "true",
    symbol,
    Number(parseFloat(amount).toFixed(5)),
    wallet.id as number
  );

if (selling === "true") {
  let ownedQuantity = 0;
  let pendingSellQuantity = 0; 

  wallet.transactions.forEach((t: any) => {
    if (t.symbol === symbol && t.status === "EXECUTED") {
      ownedQuantity += (t.isSellOrder ? -1 : 1) * t.quantity;
    }
    if (t.symbol === symbol && t.status === "PENDING" && t.isSellOrder && t.id !== transaction.id) {
      pendingSellQuantity += t.quantity;
    }
  });

  const effectivelyAvailable = ownedQuantity - pendingSellQuantity; 

  if (effectivelyAvailable < parseFloat(amount)) {
    await transactionsService.updateStatus(transaction.id, Status.FAILED);
    throw "Not enough stocks to sell";
  }

    if (isMarketOpen) {
      await transactionsService.executeTransaction(transaction, stock.price);
    }

  } else {
    const pendingCash = wallet.transactions.reduce((total: number, t: any) => {
      if (t.status === "PENDING" && !t.isSellOrder && t.id !== transaction.id) {
        const reservedPrice = t.valueAtExecution || (t.symbol === symbol ? stock.price : 0);

        return total + (reservedPrice * t.quantity);
      }
      return total;
    }, 0);

    const availableCash = wallet.cash - pendingCash;
    const costOfThisTransaction = stock.price * parseFloat(amount);

    if (availableCash < costOfThisTransaction) {
      await transactionsService.updateStatus(transaction.id, Status.FAILED);
      throw `Pas assez de cash. Dispo: ${availableCash.toFixed(2)}$, Requis: ${costOfThisTransaction.toFixed(2)}$`;
    }

    if (isMarketOpen) {
      await transactionsService.executeTransaction(transaction, stock.price);
    }
  }

  const updatedWallet = await walletsService.find(walletId);
  return res.status(200).json(updatedWallet);
}