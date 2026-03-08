import React from "react";
import TableTransactionStyles from "../styles/TableTransaction.module.css";
import { useRouter } from "next/router";

// Déstructuration des props pour inclure 'data' et 'lang'
function TableSearch({ data, lang }) {
  const router = useRouter();

  // Objet de traduction bilingue
  const translations = {
    fr: {
      symbol: "Libellé",
      name: "Nom",
      action: "Action",
      view: "Voir"
    },
    en: {
      symbol: "Symbol",
      name: "Name",
      action: "Action",
      view: "View"
    }
  };

  // Sélection de la traduction (sécurité JavaScript sans assertion de type)
  const t = translations[lang] || translations.fr;

  if (!data) return <></>;
  
  return (
    <table className={TableTransactionStyles.transactionTable}>
      <thead>
        <tr className={TableTransactionStyles.tr}>
          <th className={TableTransactionStyles.th}>{t.symbol}</th>
          <th className={TableTransactionStyles.th}>{t.name}</th>
          <th className={TableTransactionStyles.th}>{t.action}</th>
        </tr>
      </thead>
      <tbody>
        {data.map((item, index) => (
          <tr key={index} className={TableTransactionStyles.tr}>
            <td data-label={t.symbol} className={TableTransactionStyles.td} style={{ fontWeight: '700' }}>
              {item?.symbol}
            </td>
            <td data-label={t.name} className={TableTransactionStyles.td}>
              {item?.name}
            </td>
            <td data-label={t.action} className={TableTransactionStyles.td}>
              <button
                style={{
                  backgroundColor: '#f3ca3e',
                  color: '#1a1a1a',
                  border: 'none',
                  padding: '8px 25px',
                  borderRadius: '20px',
                  fontWeight: '700',
                  cursor: 'pointer',
                  fontSize: '0.85rem',
                  transition: 'transform 0.2s'
                }}
onClick={() => {
  router.push(`/market/${item?.symbol}?name=${encodeURIComponent(item?.name || "")}`);
}}
                onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
              >
                {t.view}
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export default TableSearch;