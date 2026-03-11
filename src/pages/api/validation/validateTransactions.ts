import { apiHandler } from "../../../helpers/api/api-handler";
import type { NextApiResponse } from "next";
import { Request } from "../../../types/request.type";
import { prisma } from "../../../lib/prisma";
import requestIp from "request-ip";
import stocksService from "../../../services/stocks/stocks.service";

export default apiHandler(validateTransactions);

async function validateTransactions(req: Request, res: NextApiResponse<any>) {
  if (req.method !== "GET") {
    throw `Method ${req.method} not allowed`;
  }
  if (!req.auth.isAdmin) throw "You are not allowed to log values of wallets";

  const transactions = await prisma.transaction.findMany({
    where: {
      status: "PENDING",
    },
    orderBy: {
      createdAt: "asc",
    },
    include: {
      wallet: {
        select: {
          id: true,
          cash: true,
          userId: true,
        },
      },
    },
  });

  const clientIp = requestIp.getClientIp(req);
  if (!clientIp) throw new Error("No client IP found");
  const pricesFound: { [key: string]: number } = {};
  async function getPriceFound(symbol: string): Promise<number> {
    if (pricesFound[symbol]) return pricesFound[symbol];
    const price: any = await stocksService.getLastPrice(
      symbol,
      req.auth.sub,
      clientIp as string
    );
    pricesFound[symbol] = price.results[0].price;
    return price.results[0].price as number;
  }

  const walletsRemainingCash: { [key: string]: number } = {};

  function checkIfWalletHasEnoughCash(transaction: any, price: number): boolean {
    const wallet = transaction.wallet;
    const quantity = transaction.quantity;
    let cash = walletsRemainingCash[wallet.id] ?? wallet.cash;
    walletsRemainingCash[wallet.id] = cash;
    return cash >= price * quantity;
  }

  for (const transaction of transactions) {
    const price = await getPriceFound(transaction.symbol);

    if (!transaction.isSellOrder) {
      const hasCash = checkIfWalletHasEnoughCash(transaction, price);
      if (hasCash) {
        await prisma.transaction.update({
          where: { id: transaction.id },
          data: {
            status: "EXECUTED",
            valueAtExecution: price,
            executedAt: new Date(),
          },
        });
        walletsRemainingCash[transaction.wallet.id] =
          walletsRemainingCash[transaction.wallet.id] - price * transaction.quantity;
      } else {
        await prisma.transaction.update({
          where: { id: transaction.id },
          data: {
            status: "FAILED",
            valueAtExecution: price,
            executedAt: new Date(),
          },
        });
      }
    } else {
      const hasAction = await prisma.transaction.findMany({
        where: {
          symbol: transaction.symbol,
          walletId: transaction.walletId,
          status: "EXECUTED",
        },
      });

      let totalQuantity = 0;
      hasAction.forEach((action) => {
        totalQuantity += action.isSellOrder ? -action.quantity : action.quantity;
      });

      if (totalQuantity >= transaction.quantity) {
        walletsRemainingCash[transaction.wallet.id] =
          (walletsRemainingCash[transaction.wallet.id] ?? transaction.wallet.cash) +
          price * transaction.quantity;

        await prisma.transaction.update({
          where: { id: transaction.id },
          data: {
            status: "EXECUTED",
            valueAtExecution: price,
            executedAt: new Date(),
          },
        });
      } else {
        await prisma.transaction.update({
          where: { id: transaction.id },
          data: {
            status: "FAILED",
            valueAtExecution: price,
            executedAt: new Date(),
          },
        });
      }
    }
  }

  for (const walletId in walletsRemainingCash) {
    const newCash = walletsRemainingCash[walletId];

    const executedTransactions = await prisma.transaction.findMany({
      where: {
        walletId: parseInt(walletId),
        status: "EXECUTED",
      },
    });

    const holdings: { [symbol: string]: { qty: number; lastPrice: number } } = {};
    executedTransactions.forEach((t) => {
      if (!holdings[t.symbol]) {
        holdings[t.symbol] = { qty: 0, lastPrice: t.valueAtExecution || 0 };
      }
      holdings[t.symbol].qty += t.isSellOrder ? -t.quantity : t.quantity;
      if (t.valueAtExecution) {
        holdings[t.symbol].lastPrice = t.valueAtExecution;
      }
    });

    let stocksValue = 0;
    for (const symbol in holdings) {
      if (holdings[symbol].qty > 0) {
        const currentPrice = pricesFound[symbol] || holdings[symbol].lastPrice;
        stocksValue += holdings[symbol].qty * currentPrice;
      }
    }

    const newPublicValue = newCash + stocksValue;

    await prisma.wallet.update({
      where: { id: parseInt(walletId) },
      data: {
        cash: newCash,
        publicWalletValue: newPublicValue,
        datePublicUpdated: new Date(),
      },
    });
  }

  return res.status(200).json(transactions);
}