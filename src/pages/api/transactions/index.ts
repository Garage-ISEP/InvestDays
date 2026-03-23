import { apiHandler } from "../../../helpers/api/api-handler";
import type { NextApiResponse } from "next";
import requestIp from "request-ip";
import { Request } from "../../../types/request.type";
import { Status } from "@prisma/client";
import stockService from "../../../services/stocks/stocks.service";
import transactionsService from "../../../services/transactions/transactions.service";
import walletsService from "../../../services/wallets/wallets.service";

export default apiHandler(transactionByWallet);

async function transactionByWallet(req: Request, res: NextApiResponse<any>) {
  if (req.method !== "POST") {
    throw `Method ${req.method} not allowed`;
  }

  const { amount, executed, adminPrice, walletId, symbol, selling, market } = req.body;

  if (!walletId) throw "Wallet id is required";

  const wallet = await walletsService.find(walletId, true);

  if (!wallet) throw "Wallet not found";
  if (wallet?.userId !== req.auth.sub && !req.auth.isAdmin)
    throw "You are not allowed to access this wallet";
  if (adminPrice && !req.auth.isAdmin)
    throw "You are not allowed to set admin price";
  if (!amount || (!adminPrice && !symbol))
    throw "Please provide amount and stockId or adminPrice";
  if (executed && !req.auth.isAdmin)
    throw "You are not allowed to force execute transaction";
  if (amount <= 0) throw "Amount must be greater than 0";

  if (adminPrice) {
    return res
      .status(200)
      .json(
        await walletsService.addMoney(
          walletId,
          parseFloat(adminPrice) * parseFloat(amount)
        )
      );
  }

  const clientIp = requestIp.getClientIp(req);
  if (!clientIp) throw new Error("No client IP found");

  const summary: any = await stockService.getLastPrice(
    symbol,
    req.auth.sub,
    clientIp || ""
  );

  if (summary?.results[0]?.error === "NOT_FOUND" || !summary?.results?.length) {
    throw "Unknown symbol";
  }

const stock = summary.results[0];
console.log("🔍 stock market_status:", stock.market_status, "| full stock:", JSON.stringify(stock));
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

const isCrypto = (market as string) === "crypto";
const isMarketOpen = isCrypto ? true : isNYSEOpen();

  if (!wallet.id) throw new Error("Wallet not found");

  const transaction = await transactionsService.create(
    selling === "true",
    symbol,
    Number(parseFloat(amount).toFixed(1)),
    wallet.id as number
  );

  if (selling === "true") {
    let ownedQuantity = 0;
    wallet.transactions.forEach((t: any) => {
      if (t.symbol === symbol && t.status === "EXECUTED") {
        ownedQuantity += (t.isSellOrder ? -1 : 1) * t.quantity;
      }
    });

    if (ownedQuantity < parseFloat(amount)) {
      await transactionsService.updateStatus(transaction.id, Status.FAILED);
      throw "Not enough stocks to sell";
    }

    if (isMarketOpen) {
      await transactionsService.executeTransaction(transaction, stock.price);
    }

  } else {
  const pendingCash = wallet.transactions.reduce((total: number, t: any) => {
    if (t.status === "PENDING" && !t.isSellOrder && t.id !== transaction.id) {
      const reservedPrice = t.valueAtExecution ?? stock.price;
      return total + reservedPrice * t.quantity;
    }
    return total;
  }, 0);

  const availableCash = wallet.cash - pendingCash;

  if (availableCash < stock.price * parseFloat(amount)) {
    await transactionsService.updateStatus(transaction.id, Status.FAILED);
    throw "Not enough cash to buy";
  }

  if (isMarketOpen) {
    await transactionsService.executeTransaction(transaction, stock.price);
  }
}

  const newWallet = await walletsService.find(walletId);
  return res.status(200).json(newWallet);
}