import Head from "next/head";
import homeStyles from "../styles/Home.module.css";
import legalStyles from "../styles/Legal.module.css";
import DashBoardLayout from "../components/layouts/DashBoard.layout";

export default function MentionsLegales() {
  return (
    <>
      <Head>
        <title>Invest Days - Mentions Légales</title>
        <link rel="icon" href="/favicon3.ico" />
      </Head>

      <main className={homeStyles.pageContainer}>
        <div className={homeStyles.welcomeSection}>
          <div>
            <h1 className={homeStyles.marketTitle}>Mentions Légales</h1>
            <p className={homeStyles.marketSub}>Informations obligatoires et cadre juridique du projet.</p>
          </div>
        </div>

        <div className={legalStyles.legalContent}>
          <section className={legalStyles.section}>
            <h2>1. Présentation du site</h2>
            <p>
              En vertu de l'article 6 de la loi n° 2004-575 du 21 juin 2004 pour la confiance dans l'économie numérique, 
              il est précisé aux utilisateurs du site <strong>InvestDays</strong> l'identité des différents intervenants 
              dans le cadre de sa réalisation et de son suivi :
            </p>
            <ul>
              <li><strong>Propriétaire :</strong> Garage ISEP – Association étudiante – 28 Rue Notre Dame des Champs, 75006 Paris</li>
              <li><strong>Responsable publication :</strong> Le Bureau du Garage ISEP</li>
              <li><strong>Webmaster :</strong> Équipe technique InvestDays</li>
              <li><strong>Hébergeur :</strong> Serveur ISEP</li>
            </ul>
          </section>

          <section className={legalStyles.section}>
            <h2>2. Partenariats et Données Financières</h2>
            <p>
              InvestDays utilise la technologie de <strong>Finage</strong> pour accéder aux données financières mondiales. 
              Finage est un fournisseur leader de données financières précises en temps réel (actions, forex, crypto, etc.). 
              Les données sont fournies à titre indicatif dans un but pédagogique et ne constituent pas des conseils en investissement.
            </p>
          </section>

          <section className={legalStyles.section}>
            <h2>3. Propriété intellectuelle</h2>
            <p>
              Le Garage ISEP est propriétaire des droits de propriété intellectuelle ou détient les droits d’usage sur tous 
              les éléments accessibles sur le site, notamment les textes, images, graphismes, logo, icônes, sons, logiciels. 
              Toute reproduction, représentation, modification, publication, adaptation de tout ou partie des éléments 
              du site est interdite, sauf autorisation écrite préalable.
            </p>
          </section>

          <section className={legalStyles.section}>
            <h2>4. Limitations de responsabilité</h2>
            <p>
              InvestDays est une plateforme de simulation boursière à visée éducative. Le Garage ISEP ne pourra être tenu 
              responsable des dommages directs et indirects causés au matériel de l’utilisateur, ni des pertes financières 
              virtuelles subies dans le cadre de la compétition.
            </p>
          </section>
        </div>
      </main>
    </>
  );
}

MentionsLegales.getLayout = function getLayout(page: any) {
  return <DashBoardLayout>{page}</DashBoardLayout>;
};