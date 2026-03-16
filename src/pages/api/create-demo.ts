import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "../../lib/prisma";
import bcrypt from "bcrypt";

const ADMIN_SECRET = "investdays-demo-setup-2024"; 

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).end();
  
  const { secret } = req.body;
  if (secret !== ADMIN_SECRET) {
    return res.status(403).json({ error: "Non autorisé" });
  }

  try {
    const existing = await prisma.user.findFirst({ where: { email: "jeandupont@eleve.isep.fr" } });
    if (existing) {
      return res.status(200).json({ message: "Compte déjà existant", email: "jeandupont@eleve.isep.fr" });
    }

    const hashedPassword = await bcrypt.hash("InvestDays!@2026", 10);

    const user = await prisma.user.create({
      data: {
        email: "jeandupont@eleve.isep.fr",
        name: "Jean Dupont",
        password: hashedPassword,
        studentId: "00000",
        isAdmin: false,
        emailVerified: true,
      },
    });

    await prisma.wallet.create({
      data: {
        userId: user.id,
        cash: 10000,
        publicWalletValue: 10000,
      },
    });

    return res.status(200).json({ 
      message: "Compte créé avec succès",
      email: "jeandupont@eleve.isep.fr",
      password: "InvestDays!@2026"
    });
  } catch (e: any) {
    return res.status(500).json({ error: e.message });
  }
}