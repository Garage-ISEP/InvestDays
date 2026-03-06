import { prisma } from "../../../lib/prisma";
import { apiHandler } from "../../../helpers/api/api-handler";
import type { NextApiRequest, NextApiResponse } from "next";

interface AuthenticatedRequest extends NextApiRequest {
  user?: { id: number; email: string; isAdmin: boolean };
  auth?: { id: number; email: string; isAdmin: boolean };
}

export default apiHandler(getAdminStats);

async function getAdminStats(req: AuthenticatedRequest, res: NextApiResponse) {
  const authUser = req.user ?? req.auth;

  if (!authUser || !(authUser as any).isAdmin) {
    return res.status(403).json({ 
      status: "error", 
      message: "Accès réservé aux administrateurs" 
    });
  }

  try {
    const [userCount, transactionCount, walletStats, transactions, history, users] = await Promise.all([
      prisma.user.count(),
      prisma.transaction.count(),
      prisma.wallet.aggregate({
        _sum: { cash: true },
        _avg: { cash: true }
      }),
      prisma.transaction.findMany({
        where: {
          createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
          status: "EXECUTED"
        },
        select: { createdAt: true },
        orderBy: { createdAt: "asc" }
      }),
      prisma.history.findMany({
        where: {
          date: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
        },
        select: { date: true, walletValue: true },
        orderBy: { date: "asc" }
      }),
      // ← AJOUT : inscriptions des 30 derniers jours via le wallet (createdAt)
      prisma.wallet.findMany({
        where: {
          createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
        },
        select: { createdAt: true },
        orderBy: { createdAt: "asc" }
      })
    ]);

    const txByDay: Record<string, number> = {};
    for (const tx of transactions) {
      const day = tx.createdAt.toISOString().split("T")[0];
      txByDay[day] = (txByDay[day] || 0) + 1;
    }
    const transactionsPerDay = Object.entries(txByDay).map(([date, count]) => ({ date, count }));

    const cashByDay: Record<string, number> = {};
    for (const h of history) {
      const day = h.date.toISOString().split("T")[0];
      cashByDay[day] = (cashByDay[day] || 0) + h.walletValue;
    }
    const cashPerDay = Object.entries(cashByDay).map(([date, total]) => ({ 
      date, 
      total: parseFloat(total.toFixed(2)) 
    }));

    const registrationsByDay: Record<string, number> = {};
    for (const w of users) {
      const day = w.createdAt.toISOString().split("T")[0];
      registrationsByDay[day] = (registrationsByDay[day] || 0) + 1;
    }
    let cumulative = 0;
    const registrationsPerDay = Object.entries(registrationsByDay)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, count]) => {
        cumulative += count;
        return { date, count, total: cumulative };
      });

    res.status(200).json({
      status: "success",
      data: {
        users: userCount,
        transactions: transactionCount,
        totalCash: walletStats._sum.cash || 0,
        averageCash: walletStats._avg.cash || 0,
        transactionsPerDay,
        cashPerDay,
        registrationsPerDay 
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ 
      status: "error", 
      message: "Erreur lors du calcul des stats" 
    });
  }
}