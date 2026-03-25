import Head from "next/head";
import { useState } from "react";
import homeStyles from "../styles/Home.module.css";
import contactStyles from "../styles/Contact.module.css";
import DashBoardLayout from "../components/layouts/DashBoard.layout";

export default function Contact() {
  const [status, setStatus] = useState("");

  return (
    <>
      <Head>
        <title>Invest Days - Contactez-nous</title>
        <link rel="icon" href="/favicon3.ico" />
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
              <a href="mailto:investdays@garageisep.com" className={contactStyles.emailLink}>
                investdays@garageisep.com
              </a>
            </div>

            <div className={contactStyles.infoBox}>
              <h3>Communauté Discord</h3>
              <p>Rejoignez les traders sur Discord pour une aide instantanée.</p>
              <a href="https://discord.gg/6sZcW7rEbu" target="_blank" rel="noreferrer" className={contactStyles.discordBtn}>
                Ouvrir Discord
              </a>
            </div>

            <div className={contactStyles.infoBox} >
              <h3>Groupe WhatsApp</h3>
              <p>Rejoignez notre groupe WhatsApp pour suivre les annonces en direct.</p>
              <a 
                href="https://chat.whatsapp.com/HlMP97vfI84HFcf4NpoPf5" 
                target="_blank" 
                rel="noreferrer" 
                className={contactStyles.discordBtn}
                style={{backgroundColor: '#25D366'}}
              >
                Rejoindre WhatsApp
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