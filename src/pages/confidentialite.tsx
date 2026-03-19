import Head from "next/head";
import homeStyles from "../styles/Home.module.css";
import legalStyles from "../styles/Legal.module.css";
import DashBoardLayout from "../components/layouts/DashBoard.layout";

export default function Confidentialite() {
  return (
    <>
      <Head>
        <title>Invest Days - Politique de Confidentialité</title>
        <link rel="icon" href="/favicon3.ico" />
      </Head>

      <main className={homeStyles.pageContainer}>

        <div className={homeStyles.welcomeSection}>
          <div>
            <h1 className={homeStyles.marketTitle}>Confidentialité</h1>
            <p className={homeStyles.marketSub}>Comment nous protégeons vos données personnelles au Garage Isep.</p>
          </div>
        </div>

        <div className={legalStyles.legalContent}>
          <section className={legalStyles.section}>
            <h2>1. Collecte des données</h2>
            <p>
              Dans le cadre de la compétition Invest Days, nous collectons les informations suivantes lors de votre inscription :
            </p>
            <ul>
              <li><strong>Identité :</strong> Nom, Prénom.</li>
              <li><strong>Contact :</strong> Adresse email ISEP.</li>
              <li><strong>Académique :</strong> Numéro d'élève (Student ID).</li>
            </ul>
          </section>

          <section className={legalStyles.section}>
            <h2>2. Utilisation des données</h2>
            <p>
              Vos données sont utilisées exclusivement pour :
            </p>
            <ul>
              <li>Gérer votre accès à la plateforme de trading.</li>
              <li>Établir le classement général de la compétition.</li>
              <li>Vous envoyer des notifications importantes liées à l'événement via notre serveur SMTP.</li>
            </ul>
          </section>

          <section className={legalStyles.section}>
            <h2>3. Conservation et Sécurité</h2>
            <p>
              Les données sont stockées de manière sécurisée dans notre base de données PostgreSQL. 
              Elles sont conservées uniquement pour la durée de la compétition et sont supprimées à l'issue de l'année universitaire. 
              Nous ne vendons ni ne partageons vos données avec des tiers, y compris Finage (seuls les flux financiers transitent vers Finage).
            </p>
          </section>

          <section className={legalStyles.section}>
            <h2>4. Vos droits (RGPD)</h2>
            <p>
              Conformément au Règlement Général sur la Protection des Données, vous disposez d'un droit d'accès, 
              de rectification et de suppression de vos données. Pour exercer ce droit, contactez-nous par email :
            </p>
            <p><strong>contact.isepinvest@gmail.com</strong></p>
          </section>
        </div>
      </main>
    </>
  );
}

Confidentialite.getLayout = function getLayout(page: any) {
  return <DashBoardLayout>{page}</DashBoardLayout>;
};