import { apiHandler } from "../../../helpers/api/api-handler";
import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "../../../lib/prisma";
import bcrypt from "bcrypt";

export default apiHandler(register);

async function register(req: NextApiRequest, res: NextApiResponse<any>) {
  if (req.method !== "POST") {
    throw `Method ${req.method} not allowed`;
  }

  const { email, password, studentId, name } = req.body;
  const effectiveStudentId = studentId || name;

  if (!email || !password) {
    throw "Email et mot de passe sont requis";
  }

  if (!effectiveStudentId) {
    throw "L'identifiant ISEP est requis";
  }

  const isepIdRegex = /^\d{5}$/;
  if (!isepIdRegex.test(effectiveStudentId)) {
    throw "L'identifiant ISEP doit contenir exactement 5 chiffres (ex: 12345)";
  }

  if (password.length < 8) {
    throw "Le mot de passe doit contenir au moins 8 caractères";
  }

  if (!(email.includes("@isep.fr") || email.includes("@eleve.isep.fr"))) {
    throw "Veuillez utiliser votre adresse mail ISEP";
  }


  const userExists = await prisma.user.findFirst({
    where: {
      OR: [
        { email: email },
        { studentId: effectiveStudentId },
      ],
    },
  });

  if (userExists) {
    throw "Cet email ou cet identifiant ISEP est déjà utilisé";
  }

  const hashedParameters = await bcrypt.hash(password, 10);

  const result = await prisma.$transaction(async (tx) => {
    const newUser = await tx.user.create({
      data: {
        email: email,
        name: name || "",
        password: hashedParameters,
        studentId: effectiveStudentId,
      },
    });

    const newWallet = await tx.wallet.create({
      data: {
        userId: newUser.id,
        cash: 10000,
      },
    });

    return { newUser, newWallet };
  });

  if (!result.newUser) {
    throw "Erreur lors de la création de l'utilisateur";
  }

  res.status(200).json({
    status: "success",
    message: "Utilisateur créé avec succès",
  });
}