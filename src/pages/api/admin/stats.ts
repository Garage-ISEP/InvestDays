import { Prisma } from "@prisma/client";
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
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const startDate = new Date("2024-01-01"); // Date de début du concours

    const [
      userCount, 
      transactionCount, 
      walletStats, 
      recentTransactions, 
      history, 
      newWallets,
      activeRatioGroup,
      allTimeTransactions
    ] = await Promise.all([
      prisma.user.count(),
      prisma.transaction.count(),
      prisma.wallet.aggregate({
        _sum: { cash: true },
        _avg: { cash: true }
      }),
      // Pour les stats journalières (actifs et flux)
      prisma.transaction.findMany({
        where: { createdAt: { gte: thirtyDaysAgo }, status: "EXECUTED" },
        select: { createdAt: true, walletId: true },
        orderBy: { createdAt: "asc" }
      }),
      prisma.history.findMany({
        where: { date: { gte: thirtyDaysAgo } },
        select: { date: true, walletValue: true },
        orderBy: { date: "asc" }
      }),
      prisma.wallet.findMany({
        where: { createdAt: { gte: thirtyDaysAgo } },
        select: { createdAt: true },
        orderBy: { createdAt: "asc" }
      }),
      // Ratio : au moins 5 tx sur 7 jours
      prisma.transaction.groupBy({
        by: [Prisma.TransactionScalarFieldEnum.walletId],
        where: { createdAt: { gte: sevenDaysAgo }, status: "EXECUTED" },
        _count: { id: true },
        having: { id: { _count: { gte: 5 } } }
      }),
      // Pour la courbe de croissance cumulée
      prisma.transaction.findMany({
        where: { status: "EXECUTED", createdAt: { gte: startDate } },
        select: { createdAt: true },
        orderBy: { createdAt: "asc" }
      })
    ]);

    // 1. CALCUL DES UTILISATEURS ACTIFS UNIQUES PAR JOUR (Logique Set)
    const activeUsersByDay: Record<string, Set<number>> = {};
    const txByDay: Record<string, number> = {};

    recentTransactions.forEach(tx => {
      const day = tx.createdAt.toISOString().split("T")[0];
      
      // Compte unique par jour
      if (!activeUsersByDay[day]) activeUsersByDay[day] = new Set();
      activeUsersByDay[day].add(tx.walletId);

      // Volume total de transactions par jour
      txByDay[day] = (txByDay[day] || 0) + 1;
    });

    const activeUsersPerDay = Object.entries(activeUsersByDay)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, walletSet]) => ({ date, count: walletSet.size }));

    const transactionsPerDay = Object.entries(txByDay)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, count]) => ({ date, count }));

    // 2. MASSE MONÉTAIRE PAR JOUR
    const cashByDay: Record<string, number> = {};
    history.forEach(h => {
      const day = h.date.toISOString().split("T")[0];
      cashByDay[day] = (cashByDay[day] || 0) + h.walletValue;
    });
    const cashPerDay = Object.entries(cashByDay).map(([date, total]) => ({ 
      date, 
      total: parseFloat(total.toFixed(2)) 
    }));

    // 3. INSCRIPTIONS (30j)
    const registrationsByDay: Record<string, number> = {};
    newWallets.forEach(w => {
      const day = w.createdAt.toISOString().split("T")[0];
      registrationsByDay[day] = (registrationsByDay[day] || 0) + 1;
    });
    const regData = Object.entries(registrationsByDay).map(([date, count]) => ({ date, count }));

    // 4. CROISSANCE GLOBALE (CUMULÉE)
    const globalGrowthData: { date: string; total: number }[] = [];
    let runningTotal = 0;
    const globalDailyCounts: Record<string, number> = {};

    allTimeTransactions.forEach(tx => {
      const day = tx.createdAt.toISOString().split("T")[0];
      globalDailyCounts[day] = (globalDailyCounts[day] || 0) + 1;
    });

    Object.entries(globalDailyCounts)
      .sort(([a], [b]) => a.localeCompare(b))
      .forEach(([date, count]) => {
        runningTotal += count;
        globalGrowthData.push({ date, total: runningTotal });
      });

    // 5. RATIO ACTIFS/INACTIFS
    const activeCount = activeRatioGroup.length;
    const inactiveCount = Math.max(0, userCount - activeCount);

    res.status(200).json({
      status: "success",
      data: {
        users: userCount,
        transactions: transactionCount,
        totalCash: walletStats._sum.cash || 0,
        averageCash: walletStats._avg.cash || 0,
        transactionsPerDay,
        cashPerDay,
        registrationsPerDay: regData,
        activeUsersPerDay, // <-- Nouveau champ
        cumulativeTransactions: globalGrowthData,
        activeRatio: [
          { name: "Actifs", value: activeCount },
          { name: "Inactifs", value: inactiveCount }
        ]
      }
    });
  } catch (error) {
    console.error("Stats Error:", error);
    res.status(500).json({ status: "error", message: "Erreur serveur stats" });
  }
}