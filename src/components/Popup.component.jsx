import React, { useEffect, useState } from "react";
import PopupStyles from "../styles/Popup.module.css";
import { useFetch } from "../context/FetchContext.js";
import { useWallet } from "../context/WalletContext";
import { toast } from "react-toastify";

function Popup({
  title,
  subtitle,
  sell,
  symbol,
  maxCount = 10000,
  open,
  close,
  lang,
  isMarketOpen = true,
  onSellConfirm, // 👈
}) {
  const { wallets, selectedId, actualiseWalletsLines } = useWallet();
  const [count, setCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const fetch = useFetch();
  const isBTC = symbol?.toUpperCase() === "BTCUSD";
  const step = isBTC ? 0.1 : 0.1;
  const precision = isBTC ? 1 : 1;

  const translations = {
    fr: {
      btnBuy: "Acheter",
      btnSell: "Vendre",
      btnClose: "Fermer",
      errQty: "Veillez saisir une quantité.",
      successOrder: "Votre ordre a été créé !",
      successOrderPending: "Ordre créé — sera exécuté à l'ouverture du marché.",
      errOrder: "Erreur lors de l'ordre",
      marketClosed: "Marché fermé — l'ordre sera en attente d'exécution jusqu'à la réouverture.",
      btn_sell_all: "Vendre tout",
    },
    en: {
      btnBuy: "Buy",
      btnSell: "Sell",
      btnClose: "Close",
      errQty: "Please enter a quantity.",
      successOrder: "Your order has been created!",
      successOrderPending: "Order created — will execute at market open.",
      errOrder: "Error during the order",
      marketClosed: "Market closed — the order will be pending until the market reopens.",
      btn_sell_all: "Sell all",
    },
  };
  const t = translations[lang] || translations.fr;

  useEffect(() => {
    setCount(0);
    setIsLoading(false);
  }, [open, symbol]);

  const increment = () => {
    setCount((prev) => {
      const nextVal = Number(prev) + step;
      if (nextVal >= maxCount) return Number(maxCount).toFixed(precision);
      return nextVal.toFixed(precision);
    });
  };

  const decrement = () => {
    setCount((prev) => {
      const nextVal = Number(prev) - step;
      if (nextVal <= 0) return (0).toFixed(precision);
      return nextVal.toFixed(precision);
    });
  };

  const handleChange = (e) => {
    const val = e.target.value;
    if (val === "") {
      setCount("");
      return;
    }
    const num = parseFloat(val);
    if (isNaN(num)) return;
    if (num > maxCount) {
      setCount(Number(maxCount).toFixed(precision));
    } else {
      setCount(val);
    }
  };

  const executeOrder = () => {
    const quantity = Number(count);
    if (quantity <= 0) {
      toast.error(t.errQty, {
        className: PopupStyles.toastError,
        progressClassName: PopupStyles.toastProgressError,
      });
      return;
    }

    if (isLoading) return;
    setIsLoading(true);

    const payload = {
      walletId: wallets[selectedId].id,
      symbol: symbol,
      amount: quantity.toFixed(precision),
      selling: sell ? "true" : "false",
    };

if (sell && onSellConfirm) onSellConfirm(symbol, quantity, maxCount); 
close();

    fetch
      .post("/api/transactions", payload)
      .then(() => {
        const successMsg = isMarketOpen ? t.successOrder : t.successOrderPending;
        toast.success(successMsg, {
          className: PopupStyles.toastSuccess,
          progressClassName: PopupStyles.toastProgressSuccess,
        });
        actualiseWalletsLines();
      })
      .catch(() => {
        toast.error(t.errOrder, {
          className: PopupStyles.toastError,
          progressClassName: PopupStyles.toastProgressError,
        });
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  if (!open) return null;

  return (
    <div className={PopupStyles.modalBackdrop}>
      <div className={PopupStyles.modal}>
        <div className={PopupStyles.modalContent}>
          <div className={PopupStyles.modalTitle}>
            <h1>{title} : {symbol}</h1>
            <span className={PopupStyles.modalSubtitle}>{subtitle}</span>
          </div>

          {!isMarketOpen && (
            <div style={{
              background: "#fff8e1",
              border: "1px solid #f3ca3e",
              borderRadius: "8px",
              padding: "10px 14px",
              fontSize: "12px",
              color: "#7a5f00",
              marginBottom: "16px",
              display: "flex",
              alignItems: "flex-start",
              gap: "8px",
            }}>
              <span style={{ fontSize: "14px", flexShrink: 0 }}>⏳</span>
              <span>{t.marketClosed}</span>
            </div>
          )}

          <div className={PopupStyles.inputNumberWrapper}>
            <button className={PopupStyles.decrease} onClick={decrement}>-</button>
            <input
              type="number"
              step={step}
              max={maxCount}
              value={count}
              onChange={handleChange}
              onBlur={() => {
                let n = Number(count);
                if (n > maxCount) n = maxCount;
                if (n < 0) n = 0;
                setCount(n.toFixed(precision));
              }}
            />
            <button className={PopupStyles.increase} onClick={increment}>+</button>
          </div>

          {sell && (
            <button
              className={PopupStyles.sellAllLink}
              onClick={() => setCount(Number(maxCount).toFixed(precision))}
            >
              {t.btn_sell_all}
            </button>
          )}

          <button
            className={PopupStyles.buttonBuy}
            onClick={executeOrder}
            disabled={isLoading}
            style={{ opacity: isLoading ? 0.6 : 1, cursor: isLoading ? 'not-allowed' : 'pointer' }}
          >
            {isLoading ? "..." : (sell ? t.btnSell : t.btnBuy)}
          </button>
        </div>

        <div className={PopupStyles.modalFooter}>
          <button className={PopupStyles.closeLink} onClick={close}>
            {t.btnClose}
          </button>
        </div>
      </div>
    </div>
  );
}

export default Popup;