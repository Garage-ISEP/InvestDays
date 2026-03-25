import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "../../../lib/prisma";
import jwt from "jsonwebtoken";
import * as xml2js from "xml2js";
import { google } from "googleapis";

async function isEmailAuthorized(email: string): Promise<boolean> {
  try {
    const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON!);

    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
      clientOptions: {
        subject: "investdays@garageisep.com"
      }
    });

    const sheets = google.sheets({ version: "v4", auth });

    const spreadsheetId = process.env.GOOGLE_SPREADSHEET_ID!;
    const range = "'Feuille 1'!G:G";

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range,
    });

    const rows = response.data.values;

    if (!rows || rows.length === 0) {
      console.log("La colonne est vide ou n'existe pas.");
      return false;
    }

    const emails = rows.map((row) => (row[0] ?? "").trim().toLowerCase());
    
    console.log("[SHEETS] Emails autorisés :", emails.join(", "));
    console.log("[SHEETS] Email testé :", email.trim().toLowerCase());
    console.log("[SHEETS] Résultat :", emails.includes(email.trim().toLowerCase()));

    return emails.includes(email.trim().toLowerCase());

  } catch (error) {
    console.error("[GOOGLE_SHEETS_ERROR]", error);
    return false;
  }
}

export default async function casCallback(req: NextApiRequest, res: NextApiResponse) {
  const { ticket } = req.query;

  if (!ticket) {
    return res.redirect("/login?error=Ticket_manquant");
  }

  const host = req.headers.host;
  const protocol = host?.includes("localhost") ? "http" : "https";
  const baseUrl = `${protocol}://${host}`;
  const serviceUrl = `${baseUrl}/api/auth/cas-callback`;

  const casValidateUrlBase = "https://portail-ovh.isep.fr/cas/serviceValidate";
  const casValidateUrl = `${casValidateUrlBase}?service=${encodeURIComponent(serviceUrl)}&ticket=${ticket}`;

  try {
    const response = await fetch(casValidateUrl);
    const xml = await response.text();

    const parser = new xml2js.Parser({
      explicitArray: false,
      tagNameProcessors: [xml2js.processors.stripPrefix],
    });
    const result = await parser.parseStringPromise(xml);

    const authSuccess = result.serviceResponse?.authenticationSuccess;

    if (!authSuccess) {
      console.error("CAS Auth Failed", result);
      return res.redirect("/login?error=Authentification_CAS_echouee");
    }

    const attrs = authSuccess.attributes || authSuccess;
    const email = attrs.mail;
    const studentId = attrs.login;
    const name = attrs.prenom || attrs.givenName || "Utilisateur";

    if (!email) {
      console.error("Attributs CAS manquants", attrs);
      throw new Error("Email non fourni par le CAS");
    }

    const authorized = await isEmailAuthorized(email);
    if (!authorized) {
      return res.redirect("/login?error=Acces_non_autorise");
    }

    let user = await prisma.user.findFirst({
      where: {
        OR: [{ email }, { studentId }],
      },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          email,
          studentId,
          name,
          password: "CAS_EXTERNAL_AUTH",
          emailVerified: true,
          wallet: {
            create: { cash: 10000 },
          },
        },
      });
    }

    const token = jwt.sign(
      { sub: user.id, isAdmin: user.isAdmin },
      process.env.JWT_SECRET!,
      { expiresIn: "7d" }
    );

    const userData = {
      id: user.id,
      username: user.name,
      email: user.email,
      studentId: user.studentId,
      admin: user.isAdmin,
      token,
    };

    const userEncoded = encodeURIComponent(JSON.stringify(userData));
    res.redirect(`/login?user=${userEncoded}`);

  } catch (error) {
    console.error("[CAS_CALLBACK_ERROR]", error);
    return res.redirect("/login?error=Erreur_serveur_authentification");
  }
}