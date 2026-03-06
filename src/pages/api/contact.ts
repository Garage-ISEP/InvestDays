import type { NextApiRequest, NextApiResponse } from 'next';
import nodemailer from 'nodemailer';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { name, email, subject, message } = req.body;

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    secure: true, 
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  try {
    await transporter.sendMail({
      from: `"${name}" <${process.env.SMTP_USER}>`,
      to: "dimeo.zhang@garageisep.com", 
      replyTo: email,
      subject: `[InvestDays Support] ${subject}`,
      text: `Message de: ${name} (${email})\n\n${message}`,
      html: `<p><strong>Message de:</strong> ${name} (${email})</p><p><strong>Message:</strong></p><p>${message}</p>`,
    });

    return res.status(200).json({ message: 'Email envoyé avec succès' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Erreur lors de l'envoi" });
  }
}