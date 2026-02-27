import React from "react";
import footerStyles from "../styles/Footer.module.css";
import { useLanguage } from "../context/LanguageContext";

export default function Footer() {
  const { lang } = useLanguage();

  const translations = {
    fr: {
      description: (
        <>
          <strong>InvestDays</strong> utilise la technologie Twelve Data pour accéder aux données financières. 
          Twelve Data est l'un des principaux fournisseurs mondiaux de données financières et propose des solutions précises, 
          en temps réel et historiques, couvrant les actions mondiales, le forex, la crypto, les ETF, 
          les fonds communs de placement, et plus encore. Propulsée par des technologies robustes via API REST et streaming WebSocket, 
          la plateforme offre un accès inégalé aux données en direct — par ex., BTC/USD — aux derniers événements d'entreprise, 
          rapports financiers, données d'analyse et calendrier économique.
        </>
      ),
      support: "Support",
      contact: "Contactez-nous",
      discord: "Notre Discord",
      legal: "Légal",
      mentions: "Mentions Légales",
      privacy: "Confidentialité",
      version: "v2.0"
    },
    en: {
      description: (
        <>
          <strong>InvestDays</strong> uses Twelve Data technology to access financial data. 
          Twelve Data is one of the world’s leading financial data providers and delivers accurate, 
          real-time, and historical data solutions, covering global stocks, forex, crypto, ETFs, 
          mutual funds, and more. Powered by robust technologies across REST API and WebSocket streaming, 
          the platform provides unparalleled access to live data—e.g., BTC/USD—the latest corporate events, 
          financial reports, analytics data, and economic calendar.
        </>
      ),
      support: "Support",
      contact: "Contact Us",
      discord: "Our Discord",
      legal: "Legal",
      mentions: "Legal Mentions",
      privacy: "Privacy Policy",
      version: "v2.0"
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
        </div>

        <div className={footerStyles.linksSection}>
          <div className={footerStyles.linkGroup}>
            <h4>{t.support}</h4>
            <a href="/contact">{t.contact}</a>
            <a href="https://discord.gg/hstvfHKP" target="_blank" rel="noreferrer">
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