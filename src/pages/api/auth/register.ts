import { apiHandler } from "../../../helpers/api/api-handler";
import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "../../../lib/prisma";
import bcrypt from "bcrypt";
import { transporter } from "../../../lib/mail";
import crypto from "crypto"; // Pour générer le token unique

export default apiHandler(register);

async function register(req: NextApiRequest, res: NextApiResponse<any>) {
  if (req.method !== "POST") {
    throw `Method ${req.method} not allowed`;
  }

  const { email, password, studentId, name } = req.body;
  const effectiveStudentId = studentId || name;

  console.log(`[REGISTER] Tentative d'inscription pour: ${email} (ID: ${effectiveStudentId})`);

  // 1. Validations de sécurité
  if (!email || !password) throw "Email et mot de passe sont requis";
  if (!effectiveStudentId) throw "L'identifiant ISEP est requis";

  const isepIdRegex = /^\d{5}$/;
  if (!isepIdRegex.test(effectiveStudentId)) {
    throw "L'identifiant ISEP doit contenir exactement 5 chiffres (ex: 12345)";
  }

  if (password.length < 8) throw "Le mot de passe doit contenir au moins 8 caractères";

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
    console.log(`[REGISTER] Échec: L'utilisateur ${email} existe déjà.`);
    throw "Cet email ou cet identifiant ISEP est déjà utilisé";
  }

  const hashedParameters = await bcrypt.hash(password, 10);
  const verificationToken = crypto.randomBytes(32).toString('hex'); 

  const result = await prisma.$transaction(async (tx) => {
    const newUser = await tx.user.create({
      data: {
        email: email,
        name: name || "",
        password: hashedParameters,
        studentId: effectiveStudentId,
        emailVerified: false,
        verificationToken: verificationToken,
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
    throw "Erreur lors de la création de l'utilisateur en base de données";
  }

  console.log(`[REGISTER] Utilisateur créé (ID: ${result.newUser.id}). Token généré.`);

  const baseUrl = "";
  const verificationLink = `${baseUrl}/api/auth/verify?token=${verificationToken}`;

  try {
    console.log(`[MAIL] Tentative d'envoi vers ${email}...`);
    
    await transporter.sendMail({
      from: `"InvestDays" <${process.env.SMTP_USER}>`, 
      to: email,
      subject: "Active ton compte InvestDays 📈",
      text: `Bonjour ${name}, clique ici pour vérifier ton compte : ${verificationLink}`,
     html: `
  <div style="margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #fffdf2; padding: 40px 20px;">
    <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.05); border: 1px solid #f2f2f2;">
      
      <div style="background-color: #f3ca3e; padding: 30px; text-align: center;">
        <h1 style="margin: 0; color: #000000; font-size: 26px; font-weight: 800; letter-spacing: -0.5px;">BIENVENUE SUR INVESTDAYS</h1>
      </div>

      <div style="padding: 40px 30px;">
        <p style="font-size: 18px; color: #000000; margin-bottom: 10px;">Félicitations <strong>${name || 'Trader'}</strong>,</p>
        <p style="font-size: 15px; color: #4a4a4a; line-height: 1.6;">
          Ton compte a été créé avec succès sur la plateforme de simulation boursière de l'ISEP.
        </p>

        <div style="background-color: #fffdf2; border: 2px solid #ffeaa7; border-radius: 12px; padding: 20px; margin: 30px 0;">
          <div style="display: flex; justify-content: space-between; margin-bottom: 10px; border-bottom: 1px solid #f2f2f2; padding-bottom: 10px;">
            <span style="color: #666; font-size: 14px;">Identifiant ISEP</span>
            <span style="font-weight: bold; color: #000000; float: right;">${effectiveStudentId}</span>
          </div>
          <div style="clear: both;"></div>
          <div style="display: flex; justify-content: space-between; padding-top: 10px;">
            <span style="color: #666; font-size: 14px;">Capital de départ</span>
            <span style="font-weight: bold; color: #000000; float: right;">10 000 €</span>
          </div>
          <div style="clear: both;"></div>
        </div>

        <div style="text-align: center; margin: 40px 0;">
          <a href="${verificationLink}" 
             style="background-color: #000000; color: #f3ca3e; padding: 16px 35px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; display: inline-block; text-transform: uppercase; letter-spacing: 1px;">
             Vérifier mon email
          </a>
        </div>

      </div>

      <div style="background-color: #f2f2f2; padding: 20px; text-align: center;">
        <p style="font-size: 11px; color: #bdbdbd; margin: 0; text-transform: uppercase; letter-spacing: 1px;">
          &copy; ${new Date().getFullYear()} InvestDays — Garage ISEP
        </p>
      </div>
    </div>
  </div>
`,
    });
    console.log("[MAIL] Succès ! Email de vérification envoyé.");
  } catch (mailError) {
    console.error("[MAIL] ERREUR LORS DE L'ENVOI:", mailError);
    // On ne bloque pas la réponse 200 car l'utilisateur est créé, 
    // mais il devra demander un renvoi de mail s'il ne l'a pas reçu.
  }

  // 6. Réponse finale
  return res.status(200).json({
    status: "success",
    message: "Utilisateur créé. Merci de vérifier tes mails pour activer ton compte.",
    user: { email: result.newUser.email }
  });
}