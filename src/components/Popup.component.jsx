import React from "react";
import styles from "../styles/Popup.module.css";

function Popup({ subtitle, symbol, open, close, lang }) {
  const translations = {
    fr: { btnClose: "Fermer la fenêtre" },
    en: { btnClose: "Close window" },
  };
  const t = translations[lang] || translations.fr;

  if (!open) return null;

  return (
    <div className={styles.modalBackdrop}>
      <div className={styles.modal}>
        <div className={styles.modalContent}>
          <div className={styles.modalTitle}>
            <h1>{symbol}</h1>
            <span className={styles.modalSubtitle}>{subtitle}</span>
          </div>

          <div className={styles.modalFooter}>
            <button className={styles.closeLink} onClick={close}>
              {t.btnClose}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Popup;
