import React from "react";
import styles from "../styles/TableTransaction.module.css";

/**
 * @param {{ data: any[], userId: any, lang: any }} props
 */
function TableRanks({ data = [], userId, lang }) {
  const translations = {
    fr: {
      rank: "CLASSEMENT",
      investor: "INVESTISSEUR",
      totalValue: "VALEUR TOTALE",
      loading: "Chargement...",
      you: "(Vous)",
      gap: "..."
    },
    en: {
      rank: "RANKING",
      investor: "INVESTOR",
      totalValue: "TOTAL VALUE",
      loading: "Loading...",
      you: "(You)",
      gap: "..."
    }
  };

  const t = translations[lang] || translations.fr;

 const bestWalletsPerUser = data.reduce((acc, current) => {
    const currentUserId = current.user?.id;
    if (!currentUserId) return acc;

    const existingIndex = acc.findIndex(item => item.user?.id === currentUserId);

    if (existingIndex === -1) {
      acc.push(current);
    } else {
      const existingValue = Number(acc[existingIndex].publicWalletValue) || 0;
      const currentValue = Number(current.publicWalletValue) || 0;
      if (currentValue > existingValue) {
        acc[existingIndex] = current;
      }
    }
    return acc;
  }, []);

  const allRanked = bestWalletsPerUser
    .filter((item) => item?.user?.isAdmin === false && item?.user?.isPartenaire === false)
    .sort((a, b) => (Number(b.publicWalletValue) || 0) - (Number(a.publicWalletValue) || 0));

  if (!allRanked.length) {
    return <p style={{ textAlign: 'center', padding: '20px', color: '#888' }}>{t.loading}</p>;
  }


const myIndex = allRanked.findIndex(item => String(item.user?.id) === String(userId));

let displayData = [];

const top10 = allRanked.slice(0, 10);
displayData = [...top10];

if (myIndex >= 10) {
  displayData.push({ isSeparator: true, id: 'sep-1' });

  const neighbors = [];
  if (allRanked[myIndex - 1]) neighbors.push(allRanked[myIndex - 1]);
  neighbors.push(allRanked[myIndex]);
  if (allRanked[myIndex + 1]) neighbors.push(allRanked[myIndex + 1]);

  neighbors.forEach(n => {
    if (!displayData.find(item => item.user?.id === n.user?.id)) {
      displayData.push(n);
    }
  });
}

  return (
    <table className={styles.transactionTable}>
      <thead>
        <tr className={styles.tr}>
          <th className={styles.th}>{t.rank}</th>
          <th className={styles.th}>{t.investor}</th>
          <th className={styles.th}>{t.totalValue}</th>
        </tr>
      </thead>
      <tbody>
        {displayData.map((item) => {
          if (item.isSeparator) {
            return (
              <tr key={item.id} className={styles.tr}>
                <td colSpan={3} style={{ textAlign: 'center', color: '#aaa', padding: '10px', fontSize: '1.2rem' }}>
                  {t.gap}
                </td>
              </tr>
            );
          }

          const globalRank = allRanked.findIndex(orig => String(orig.user?.id) === String(item.user?.id)) + 1;
          const medals = ["🥇", "🥈", "🥉"];
          const totalValue = Number(item.publicWalletValue) || 0;
          const isMe = item.user?.id === userId;

          return (
            <tr 
              key={item.id} 
              className={`${styles.tr} ${isMe ? styles.currentUserRow : ""}`}
            >
              <td className={styles.td} style={{ fontWeight: '700' }}>
                {globalRank <= 3 ? medals[globalRank - 1] : `#${globalRank}`}
              </td>
              <td className={styles.td}>
                <div style={{ fontWeight: '600' }}>
                  {item.user?.name || `Joueur ${item.user?.studentId || ''}`} 
                  {isMe && <span style={{ marginLeft: '8px', opacity: 0.8, fontWeight: '800' }}>{t.you}</span>}
                </div>
              </td>
              <td className={styles.td} style={{ fontWeight: '800' }}>
                {totalValue.toLocaleString(undefined, { 
                    minimumFractionDigits: 2, 
                    maximumFractionDigits: 2 
                })} $
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

export default TableRanks;