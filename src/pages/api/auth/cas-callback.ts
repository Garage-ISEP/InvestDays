import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "../../../lib/prisma";
import jwt from "jsonwebtoken";
import * as xml2js from "xml2js";

export default async function casCallback(req: NextApiRequest, res: NextApiResponse) {
  const { ticket } = req.query;

  if (!ticket) {
    return res.redirect("/login?error=Ticket_manquant");
  }

  const host = req.headers.host;
  const protocol = host?.includes("localhost") ? "http" : "https";
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || `${protocol}://${host}`;
  
  const serviceUrl = `${baseUrl}/api/auth/cas-callback`;

  const casValidateUrlBase = process.env.CAS_VALIDATE_URL;
  
  const casValidateUrl = `${casValidateUrlBase}?service=${encodeURIComponent(serviceUrl)}&ticket=${ticket}`;

  try {
    const response = await fetch(casValidateUrl);
    const xml = await response.text();

    const parser = new xml2js.Parser({ 
        explicitArray: false, 
        tagNameProcessors: [xml2js.processors.stripPrefix] 
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

    let user = await prisma.user.findFirst({
      where: {
        OR: [{ email: email }, { studentId: studentId }]
      }
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
            create: { cash: 10000 }
          }
        }
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
      token: token,
    };

    const userEncoded = encodeURIComponent(JSON.stringify(userData));

    res.redirect(`/login?user=${userEncoded}`);
    return; 

  } catch (error) {
    console.error("[CAS_CALLBACK_ERROR]", error);
    return res.redirect("/login?error=Erreur_serveur_authentification");
  }
}