import React from "react";
import footerStyles from "../styles/Footer.module.css";
import { useLanguage } from "../context/LanguageContext";
import Image from "next/image"; // Importation pour optimiser l'image

export default function Footer() {
  const { lang } = useLanguage();

  const translations = {
    fr: {
      support: "Support",
      contact: "Contactez-nous",
      discord: "Notre Discord",
      legal: "Légal",
      mentions: "Mentions Légales",
      privacy: "Confidentialité",
      version: "v2.0",
      dataSource: "Données fournies par"
    },
    en: {
      support: "Support",
      contact: "Contact Us",
      discord: "Our Discord",
      legal: "Legal",
      mentions: "Legal Mentions",
      privacy: "Privacy Policy",
      version: "v2.0",
      dataSource: "Data provided by"
    }
  };

  const t = translations[lang] || translations.fr;

  return (
    <footer className={footerStyles.container}>
      <div className={footerStyles.content}>
        <div className={footerStyles.descriptionSection}>
          <p className={footerStyles.twelveDataText}>
            {t.description}
          </p>

          <div style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <span style={{ fontSize: '12px', opacity: 0.7 }}>{t.dataSource}</span>
            <a href="https://finage.co.uk" target="_blank" rel="noreferrer">
              <img 
                src="/assets/partners/finage_logo.svg" 
                alt="Finage Logo" 
                style={{ height: '30px', filter: 'grayscale(100%) brightness(1.5)', opacity: 0.8 }}
                onMouseOver={(e) => e.currentTarget.style.filter = 'grayscale(0%)'}
                onMouseOut={(e) => e.currentTarget.style.filter = 'grayscale(100%) brightness(1.5)'}
              />
            </a>
          </div>
        </div>

        <div className={footerStyles.linksSection}>
          <div className={footerStyles.linkGroup}>
            <h4>{t.support}</h4>
            <a href="/contact">{t.contact}</a>
            <a href="https://discord.gg/FBKyc87pHh" target="_blank" rel="noreferrer">
              {t.discord}
            </a>
          </div>

          <div className={footerStyles.linkGroup}>
            <h4>{t.legal}</h4>
            <a href="/MentionsLegales">{t.mentions}</a>
            <a href="/confidentialite">{t.privacy}</a>
          </div>
        </div>
      </div>

      <div className={footerStyles.bottomBar}>
        <span>© {new Date().getFullYear()} InvestDays - {t.version}</span>
        <span>GarageISEP</span>
      </div>
    </footer>
  );
}