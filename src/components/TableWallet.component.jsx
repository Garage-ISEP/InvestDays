import React, { useEffect, useState } from "react";
import TableTransactionStyles from "../styles/TableTransaction.module.css";
import { useWallet } from "../context/WalletContext";
import Popup from "./Popup.component";
import { toast } from "react-toastify"; 
function TableWallet({ selectedId, activeWalletTransactions, lang }) {
  const [symbol, setSymbol] = useState("");
  const [maxCount, setMaxCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [sortKey, setSortKey] = useState(null);
  const [sortDir, setSortDir] = useState("asc");
  const [sellingSymbols, setSellingSymbols] = useState(new Set());
  const { walletsLines, actualiseWalletsLines, valuesCached } = useWallet();

  const infoIconStyle = {
    marginLeft: '8px',
    cursor: 'pointer',
    fontSize: '0.7rem',
    color: '#3498db',
    border: '1px solid #3498db',
    borderRadius: '50%',
    width: '16px',
    height: '16px',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    verticalAlign: 'middle',
    fontWeight: 'bold',
    backgroundColor: '#ebf5fb',
    transition: 'transform 0.1s ease'
  };

  const translations = {
    fr: {
      h_symbol: "Libellé",
      h_quantity: "Quantité",
      h_buy: "Valeur achat",
      h_current: "Valeur actuelle",
      h_var_dollar: "Var $",
      h_var_percent: "Var %",
      h_gain: "Gain",
      h_action: "Action",
      btn_sell: "Vendre",
      pop_title: "Vendre des actions",
      pop_sub: "Confirmez la vente pour",
      h_var_dollar_info: "Variation de la valeur par action par rapport au prix d'achat moyen.",
      h_var_percent_info: "Performance en pourcentage depuis l'achat.",
      h_gain_info: "Gain ou perte totale latente (Variation $ × Quantité).",
    },
    en: {
      h_symbol: "Symbol",
      h_quantity: "Quantity",
      h_buy: "Buy Price",
      h_current: "Current Price",
      h_var_dollar: "Var $",
      h_var_percent: "Var %",
      h_gain: "Profit",
      h_action: "Action",
      btn_sell: "Sell",
      pop_title: "Sell Stocks",
      pop_sub: "Confirm sale for",
      h_var_dollar_info: "Price variation per share compared to the average buy price.",
      h_var_percent_info: "Percentage performance since purchase.",
      h_gain_info: "Total unrealized profit or loss (Var $ × Quantity).",
    }
  };

  const t = translations[lang] || translations.fr;

  // Fonction pour afficher l'explication au clic
  const showInfo = (e, text) => {
    e.stopPropagation(); // Empêche le tri de la colonne lors du clic sur l'icône
    toast.info(text, {
      position: "bottom-right",
      autoClose: 4000,
      hideProgressBar: true,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
    });
  };

  useEffect(() => {
    if (!(walletsLines && walletsLines[selectedId])) actualiseWalletsLines();
  }, [activeWalletTransactions, selectedId]);

  const enrichedLines = (walletsLines?.[selectedId] || []).map((item) => {
    const value = valuesCached?.[item.symbol]?.value;
    if (value == null) return null;

    let quantityBuy = 0;
    let averagePriceAtExecution = item.valueAtExecution.reduce(
      (acc, item2) => {
        quantityBuy += item2.quantity;
        return acc + item2.quantity * item2.price;
      }, 0
    );
    averagePriceAtExecution = averagePriceAtExecution / quantityBuy;

    const variation = value - averagePriceAtExecution;
    const variationPercent = averagePriceAtExecution
      ? (variation / averagePriceAtExecution) * 100
      : 0;
    const gain = variation * item.quantity;

    return {
      ...item,
      value,
      averagePriceAtExecution,
      variation,
      variationPercent,
      gain,
    };
  }).filter(Boolean);

  const sortedLines = [...enrichedLines].sort((a, b) => {
    if (!sortKey) return 0;
    let valA = a[sortKey];
    let valB = b[sortKey];
    if (typeof valA === "string") valA = valA.toLowerCase();
    if (typeof valB === "string") valB = valB.toLowerCase();
    if (valA < valB) return sortDir === "asc" ? -1 : 1;
    if (valA > valB) return sortDir === "asc" ? 1 : -1;
    return 0;
  });

  const visibleLines = sortedLines.filter(item => !sellingSymbols.has(item.symbol));

  function handleSellConfirm(symbol, quantitySold, totalQuantity) {
    if (quantitySold >= totalQuantity) {
      setSellingSymbols(prev => new Set(prev).add(symbol));
    }
  }

  function handleSort(key) {
    if (sortKey === key) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  }

  function SortIcon({ colKey }) {
    if (sortKey !== colKey) return <span style={{ opacity: 0.3, marginLeft: '4px' }}>↕</span>;
    return <span style={{ marginLeft: '4px' }}>{sortDir === "asc" ? "↑" : "↓"}</span>;
  }

  const thStyle = {
    cursor: "pointer",
    userSelect: "none",
    whiteSpace: "nowrap",
  };

  return (
    <>
      <table className={TableTransactionStyles.transactionTable}>
        <thead>
          <tr className={TableTransactionStyles.tr}>
            <th className={TableTransactionStyles.th} style={thStyle} onClick={() => handleSort("symbol")}>
              {t.h_symbol}<SortIcon colKey="symbol" />
            </th>
            <th className={TableTransactionStyles.th} style={thStyle} onClick={() => handleSort("quantity")}>
              {t.h_quantity}<SortIcon colKey="quantity" />
            </th>
            <th className={TableTransactionStyles.th} style={thStyle} onClick={() => handleSort("averagePriceAtExecution")}>
              {t.h_buy}<SortIcon colKey="averagePriceAtExecution" />
            </th>
            <th className={TableTransactionStyles.th} style={thStyle} onClick={() => handleSort("value")}>
              {t.h_current}<SortIcon colKey="value" />
            </th>
            
            {/* Colonne Var $ */}
            <th className={TableTransactionStyles.th} style={thStyle} onClick={() => handleSort("variation")}>
              {t.h_var_dollar}
              <span 
                className={TableTransactionStyles.infoIcon} 
                onClick={(e) => showInfo(e, t.h_var_dollar_info)}
              >
                i
              </span>
              <SortIcon colKey="variation" />
            </th>

            {/* Colonne Var % */}
            <th className={TableTransactionStyles.th} style={thStyle} onClick={() => handleSort("variationPercent")}>
              {t.h_var_percent}
              <span 
                className={TableTransactionStyles.infoIcon} 
                onClick={(e) => showInfo(e, t.h_var_percent_info)}
              >
                i
              </span>
              <SortIcon colKey="variationPercent" />
            </th>

            {/* Colonne Gain */}
            <th className={TableTransactionStyles.th} style={thStyle} onClick={() => handleSort("gain")}>
              {t.h_gain}
              <span 
                className={TableTransactionStyles.infoIcon} 
                onClick={(e) => showInfo(e, t.h_gain_info)}
              >
                i
              </span>
              <SortIcon colKey="gain" />
            </th>

            <th className={TableTransactionStyles.th}>
              {t.h_action}
            </th>
          </tr>
        </thead>
        <tbody>
          {visibleLines.map((item, index) => {
            const isPositive = item.variation >= 0;
            return (
              <tr key={index} className={TableTransactionStyles.tr}>
                <td data-label={t.h_symbol} className={TableTransactionStyles.td} style={{ fontWeight: 'bold' }}>
                  {item.symbol}
                </td>
                <td data-label={t.h_quantity} className={TableTransactionStyles.td}>
                  {item.quantity?.toFixed(1)}
                </td>
                <td data-label={t.h_buy} className={TableTransactionStyles.td}>
                  {item.averagePriceAtExecution?.toFixed(2)} $
                </td>
                <td data-label={t.h_current} className={TableTransactionStyles.td}>
                  {item.value?.toFixed(2)} $
                </td>
                <td data-label={t.h_var_dollar} className={TableTransactionStyles.td} style={{ color: isPositive ? '#2ecc71' : '#e74c3c' }}>
                  {isPositive ? '+' : ''}{item.variation.toFixed(2)} $
                </td>
                <td data-label={t.h_var_percent} className={TableTransactionStyles.td} style={{ color: isPositive ? '#2ecc71' : '#e74c3c' }}>
                  {item.variationPercent.toFixed(2)} %
                </td>
                <td data-label={t.h_gain} className={TableTransactionStyles.td} style={{ fontWeight: 'bold' }}>
                  {item.gain.toFixed(2)} $
                </td>
                <td data-label={t.h_action} className={TableTransactionStyles.td}>
                  <button
                    className={TableTransactionStyles.sellButton}
                    onClick={() => {
                      setIsOpen(true);
                      setSymbol(item.symbol);
                      setMaxCount(item.quantity);
                    }}
                  >
                    {t.btn_sell}
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <Popup
        title={t.pop_title}
        subtitle={`${t.pop_sub} ${symbol}`}
        sell={true}
        symbol={symbol}
        maxCount={maxCount}
        open={isOpen}
        close={() => setIsOpen(false)}
        lang={lang}
        onSellConfirm={handleSellConfirm}
      />
    </>
  );
}

export default TableWallet;