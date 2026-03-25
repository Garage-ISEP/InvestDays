import { apiHandler } from "../../../helpers/api/api-handler";
import { prisma } from "../../../lib/prisma";
import type { NextApiResponse } from "next";
import { Request } from "../../../types/request.type";

export default apiHandler(getAllWallets);

async function getAllWallets(req: Request, res: NextApiResponse) {
  if (req.method !== "GET") throw `Method ${req.method} not allowed`;

  if (!req.auth.isAdmin) {
    return res.status(403).json({ error: "Accès réservé aux administrateurs" });
  }

  const wallets = await prisma.wallet.findMany({
    orderBy: { createdAt: "asc" },
    include: {
      user: {
        select: { id: true, email: true, isAdmin: true },
      },
      transactions: {
        select: {
          createdAt: true,
          isSellOrder: true,
          symbol: true,
          valueAtExecution: true,
          quantity: true,
          status: true,
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  return res.status(200).json(wallets);
}