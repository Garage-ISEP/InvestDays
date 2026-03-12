import React from "react";
import TableTransactionStyles from "../styles/TableTransaction.module.css";
import { useRouter } from "next/router";

function TableSearch({ data, lang }) {
  const router = useRouter();

  const translations = {
    fr: {
      symbol: "Libellé",
      name: "Nom",
      market: "Marché",
      action: "Action",
      view: "Voir",
      stocks: "Actions",
      crypto: "Crypto",
      forex: "Forex",
    },
    en: {
      symbol: "Symbol",
      name: "Name",
      market: "Market",
      action: "Action",
      view: "View",
      stocks: "Stocks",
      crypto: "Crypto",
      forex: "Forex",
    }
  };

  const t = translations[lang] || translations.fr;

  const marketColors = {
    stocks: { bg: '#e6f9f1', color: '#2ecc71' },
    crypto: { bg: '#eef2ff', color: '#6366f1' },
    forex:  { bg: '#fff7e6', color: '#f39c12' },
  };

  const marketLabel = {
    stocks: t.stocks,
    crypto: t.crypto,
    forex:  t.forex,
  };

  if (!data) return <></>;

  return (
    <table className={TableTransactionStyles.transactionTable}>
      <thead>
        <tr className={TableTransactionStyles.tr}>
          <th className={TableTransactionStyles.th}>{t.symbol}</th>
          <th className={TableTransactionStyles.th}>{t.name}</th>
          <th className={TableTransactionStyles.th}>{t.market}</th>
          <th className={TableTransactionStyles.th}>{t.action}</th>
        </tr>
      </thead>
      <tbody>
        {data.map((item, index) => {
          const mkt = item?.market || "stocks";
          const mktStyle = marketColors[mkt] || marketColors.stocks;

          return (
            <tr key={index} className={TableTransactionStyles.tr}>
              <td data-label={t.symbol} className={TableTransactionStyles.td} style={{ fontWeight: '700' }}>
                {item?.symbol}
              </td>
              <td data-label={t.name} className={TableTransactionStyles.td}>
                {item?.name}
              </td>
              <td data-label={t.market} className={TableTransactionStyles.td}>
                <span style={{
                  backgroundColor: mktStyle.bg,
                  color: mktStyle.color,
                  padding: '3px 10px',
                  borderRadius: '20px',
                  fontSize: '12px',
                  fontWeight: '700',
                }}>
                  {marketLabel[mkt] || mkt}
                </span>
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
                    router.push(`/market/${item?.symbol}?name=${encodeURIComponent(item?.name || "")}&market=${item?.market || "stocks"}`);
                  }}
                  onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                  onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
                >
                  {t.view}
                </button>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

export default TableSearch;