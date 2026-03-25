import { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "../../../lib/prisma";
import transactionsService from "../../../services/transactions/transactions.service";
import stockService from "../../../services/stocks/stocks.service";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const secretKey = process.env.CRON_SECRET;
  if (secretKey && req.query.key !== secretKey) {
    return res.status(401).json({ error: "Non autorisé" });
  }

  try {
    const pendingOrders = await prisma.transaction.findMany({
      where: { status: "PENDING" },
      take: 500,
    });

    if (pendingOrders.length === 0) {
      return res.status(200).json({ message: "Aucune transaction en attente." });
    }

    const report = [];

    const now = new Date();
    const day = now.getUTCDay(); 
    const hour = now.getUTCHours();
    const nyTime = new Date(now.toLocaleString("en-US", { timeZone: "America/New_York" }));
    const nyDay = nyTime.getDay();
    const nyHour = nyTime.getHours();
    const nyMin = nyTime.getMinutes();
    const nyTotalMin = nyHour * 60 + nyMin;
    const isNYSEOpenManual = nyDay >= 1 && nyDay <= 5 && nyTotalMin >= 570 && nyTotalMin < 960;

    const isForexOpen = !(day === 6 || (day === 5 && hour >= 22) || (day === 0 && hour < 22));

    for (const order of pendingOrders) {
      const summary: any = await stockService.getLastPrice(order.symbol, 0, "127.0.0.1");
      const stock = summary?.results?.[0];

      if (!stock || !stock.price) {
        report.push({ symbol: order.symbol, status: "ERROR", reason: "Price not found" });
        continue;
      }

      const symbolUpper = order.symbol.toUpperCase();
      const forexPairs = ['EURUSD', 'USDJPY', 'GBPUSD', 'USDCHF', 'AUDUSD', 'USDCAD', 'NZDUSD', 'EURJPY', 'GBPJPY', 'EURGBP'];
      
      const isForex = forexPairs.includes(symbolUpper) || order.symbol.includes('/');
      const isCrypto = symbolUpper.endsWith("USD") || symbolUpper.endsWith("BTC") || symbolUpper.endsWith("ETH") || symbolUpper.endsWith("USDT");

      const isStockOpen = (stock.market_status === "open" || isNYSEOpenManual);
      
      const shouldExecute = 
        isCrypto || 
        (isForex && isForexOpen) || 
        (!isCrypto && !isForex && isStockOpen);

      if (shouldExecute) {
        const executionPrice = Number(stock.price);
        await transactionsService.executeTransaction(order, executionPrice);
        
        report.push({ symbol: order.symbol, status: "SUCCESS", price: executionPrice });
      } else {
        report.push({ symbol: order.symbol, status: "STILL_PENDING", reason: "Market closed" });
      }
    }

    return res.status(200).json({ processed: pendingOrders.length, details: report });

  } catch (error) {
    console.error("[CRON ERROR]", error);
    return res.status(500).json({ error: "Erreur interne" });
  }
}