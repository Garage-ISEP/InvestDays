import React from "react";
import styles from "../styles/TableTransaction.module.css";

// Ajout de 'lang' dans les props pour la synchronisation globale
function TableRanks({ data = [], selectedId, lang }) {
  
  // Objet de traduction pour le classement
  const translations = {
    fr: {
      rank: "CLASSEMENT",
      investor: "INVESTISSEUR",
      cash: "ARGENT DISPONIBLE",
      id: "PORTEFEUILLE ID",
      loading: "Chargement des traders..."
    },
    en: {
      rank: "RANKING",
      investor: "INVESTOR",
      cash: "AVAILABLE CASH",
      id: "PORTFOLIO ID",
      loading: "Loading traders..."
    }
  };

  // Sélection de la langue avec sécurité pour le typage
  const t = translations[lang] || translations.fr;

  // TRI SUR LE CASH UNIQUEMENT
  const rankedData = [...data]
    .filter((item) => item?.user?.isAdmin === false)
    .sort((a, b) => (Number(b.cash) || 0) - (Number(a.cash) || 0));

  if (!rankedData.length) {
    return <p style={{ textAlign: 'center', padding: '20px', color: '#888' }}>{t.loading}</p>;
  }

  return (
    <table className={styles.transactionTable}>
      <thead>
        <tr className={styles.tr}>
          <th className={styles.th}>{t.rank}</th>
          <th className={styles.th}>{t.investor}</th>
          <th className={styles.th}>{t.cash}</th>
          <th className={styles.th}>{t.id}</th>
        </tr>
      </thead>
      <tbody>
        {rankedData.map((item, index) => {
          const rank = index + 1;
          const medals = ["🥇", "🥈", "🥉"];
          const cashVal = Number(item.cash) || 0;
          const isSelected = item.id === selectedId;
          
          let podiumClass = "";
          if (rank === 1) podiumClass = styles.goldRow;
          else if (rank === 2) podiumClass = styles.silverRow;
          else if (rank === 3) podiumClass = styles.bronzeRow;

          return (
            <tr key={item.id} className={`${styles.tr} ${podiumClass} ${isSelected ? styles.selectedRow : ""}`}>
              <td className={styles.td} style={{ fontWeight: '700' }}>
                {rank <= 3 ? medals[index] : `#${rank}`}
              </td>
              <td className={styles.td}>
                <div style={{ fontWeight: '600' }}>
                  {item.user?.name || `Joueur ${item.user?.studentId || ''}`}
                </div>
                <div style={{ fontSize: '0.75rem', color: '#888' }}>
                </div>
              </td>
              <td className={styles.td} style={{ fontWeight: '800', color: '#2ecc71' }}>
                {cashVal.toLocaleString(undefined, { minimumFractionDigits: 2 })} $
              </td>
              <td className={styles.td} style={{ color: '#888', fontSize: '0.85rem' }}>
                ID: {item.id}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

export default TableRanks;