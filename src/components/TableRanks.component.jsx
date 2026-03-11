import React from "react";
import styles from "../styles/TableTransaction.module.css";

const STARTING_CASH = 10000;

function TableRanks({ data = [], selectedId, lang }) {

  const translations = {
    fr: {
      rank: "CLASSEMENT",
      investor: "INVESTISSEUR",
      profit: "PROFIT/PERTE",
      loading: "Chargement des traders..."
    },
    en: {
      rank: "RANKING",
      investor: "INVESTOR",
      profit: "PROFIT/LOSS",
      loading: "Loading traders..."
    }
  };

  const t = translations[lang] || translations.fr;

  const rankedData = [...data]
    .filter((item) => item?.user?.isAdmin === false)
    .sort((a, b) => (Number(b.publicWalletValue) || 0) - (Number(a.publicWalletValue) || 0));

  if (!rankedData.length) {
    return <p style={{ textAlign: 'center', padding: '20px', color: '#888' }}>{t.loading}</p>;
  }

  return (
    <table className={styles.transactionTable}>
      <thead>
        <tr className={styles.tr}>
          <th className={styles.th}>{t.rank}</th>
          <th className={styles.th}>{t.investor}</th>
          <th className={styles.th}>{t.profit}</th>
        </tr>
      </thead>
      <tbody>
        {rankedData.map((item, index) => {
          const rank = index + 1;
          const medals = ["🥇", "🥈", "🥉"];
          const totalValue = Number(item.publicWalletValue) || 0;
          const profit = totalValue - STARTING_CASH;
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
              </td>
              <td className={styles.td} style={{ fontWeight: '800', color: profit >= 0 ? '#2ecc71' : '#e74c3c' }}>
                {profit >= 0 ? "+" : ""}{profit.toLocaleString(undefined, { minimumFractionDigits: 2 })} $
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

export default TableRanks;