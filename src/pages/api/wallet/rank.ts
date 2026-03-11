import { apiHandler } from "../../../helpers/api/api-handler";
import { Request } from "../../../types/request.type";
import type { NextApiResponse } from "next";
import { prisma } from "../../../lib/prisma";

export default apiHandler(rank);

async function rank(req: Request, res: NextApiResponse<any>) {
  if (req.method !== "GET") {
    throw `Method ${req.method} not allowed`;
  }

  const allWallets = await prisma.wallet.findMany({
    take: 50,
    include: {
      user: {
        select: {
          id: true,
          email: true,
          name: true,
          isAdmin: true,
        },
      },
    },
    orderBy: {
      publicWalletValue: "desc",
    },
  });

  const seenUsers = new Map<number, typeof allWallets[0]>();

  for (const wallet of allWallets) {
    if (!wallet.user || wallet.user.isAdmin) continue;

    const existing = seenUsers.get(wallet.userId);
    if (!existing || wallet.publicWalletValue > existing.publicWalletValue) {
      seenUsers.set(wallet.userId, wallet);
    }
  }

  const top10 = Array.from(seenUsers.values())
    .sort((a, b) => b.publicWalletValue - a.publicWalletValue)
    .slice(0, 10);

  return res.status(200).json(top10);
}