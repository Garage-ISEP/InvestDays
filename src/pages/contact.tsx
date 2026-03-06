import Head from "next/head";
import { useState } from "react";
import homeStyles from "../styles/Home.module.css";
import contactStyles from "../styles/Contact.module.css";
import DashBoardLayout from "../components/layouts/DashBoard.layout";

export default function Contact() {
  const [status, setStatus] = useState("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setStatus("Envoi en cours...");
    
    const formData = new FormData(e.currentTarget);
    const data = {
      name: formData.get("name"),
      email: formData.get("email"),
      subject: formData.get("subject"),
      message: formData.get("message"),
    };

    const response = await fetch("/api/contact", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (response.ok) {
      setStatus("Message envoyé avec succès !");
      (e.target as HTMLFormElement).reset();
    } else {
      setStatus("Erreur lors de l'envoi. Réessayez.");
    }
  };

  return (
    <>
      <Head>
        <title>InvestDays - Contactez-nous</title>
      </Head>

      <main className={homeStyles.pageContainer}>
        <div className={homeStyles.welcomeSection}>
          <div>
            <h1 className={homeStyles.marketTitle}>Contactez-nous</h1>
            <p className={homeStyles.marketSub}>Besoin d'aide ? Retrouvez-nous dans nos bureaux ou envoyez-nous un message.</p>
          </div>
        </div>

        <div className={contactStyles.contactGrid}>
          <div className={contactStyles.mainColumn}>
            
            <div className={contactStyles.formCard} style={{ marginBottom: '30px' }}>
              <h2 className={contactStyles.sectionTitle}>Envoyez-nous un message</h2>
              <form onSubmit={handleSubmit}>
                <div className={contactStyles.inputGroup}>
                  <label>Nom complet</label>
                  <input name="name" type="text" required placeholder="Jean Dupont" />
                </div>
                <div className={contactStyles.inputGroup}>
                  <label>Email ISEP</label>
                  <input name="email" type="email" required placeholder="prenom.nom@eleve.isep.fr" />
                </div>
                <div className={contactStyles.inputRow}>
                  <div className={contactStyles.inputGroup} style={{ flex: 1 }}>
                    <label>Sujet</label>
                    <select name="subject">
                      <option>Problème technique</option>
                      <option>Question sur les règles</option>
                      <option>Partenariat / Twelve Data</option>
                      <option>Autre</option>
                    </select>
                  </div>
                </div>
                <div className={contactStyles.inputGroup}>
                  <label>Message</label>
                  <textarea name="message" required rows={5} placeholder="Comment pouvons-nous vous aider ?"></textarea>
                </div>
                {status && <p className={contactStyles.statusMsg}>{status}</p>}
                <button type="submit" className={homeStyles.buyButton}>
                  Envoyer le message
                </button>
              </form>
            </div>

            <div className={contactStyles.formCard}>
              <h2 className={contactStyles.sectionTitle}>Nos Bureaux</h2>
              <div className={contactStyles.addressGrid}>
                <div className={contactStyles.addressBlock}>
                  <h3>📍 Paris (NDC)</h3>
                  <p className={contactStyles.addressText}>28 Rue Notre Dame des Champs, 75006 Paris</p>
                  <ul className={contactStyles.transportList}>
                    <li><strong>Métro 4, 6, 12 :</strong> St-Placide, Edgar Quinet, NDDC</li>
                  </ul>
                </div>
                <div className={contactStyles.addressBlock}>
                  <h3>📍 Issy (NDL)</h3>
                  <p className={contactStyles.addressText}>10 Rue de Vanves, 92130 Issy-les-Moulineaux</p>
                  <ul className={contactStyles.transportList}>
                    <li><strong>Métro 12 :</strong> Corentin Celton</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
          
          <div className={contactStyles.infoSidebar}>
            <div className={contactStyles.infoBox}>
              <h3>Support Direct</h3>
              <p className={contactStyles.phoneText}>📞 06 00 00 00 00</p>
              <a href="mailto:investdays@garageisep.com" className={contactStyles.emailLink}>
                investdays@garageisep.com
              </a>
            </div>

            <div className={contactStyles.infoBox}>
              <h3>Communauté</h3>
              <p>Rejoignez les traders sur Discord pour une aide instantanée.</p>
              <a href="https://discord.gg/hstvfHKP" target="_blank" rel="noreferrer" className={contactStyles.discordBtn}>
                Ouvrir Discord
              </a>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}

Contact.getLayout = function getLayout(page: any) {
  return <DashBoardLayout>{page}</DashBoardLayout>;
};