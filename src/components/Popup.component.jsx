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
  lang 
}) {
  const { wallets, selectedId } = useWallet();
  const [count, setCount] = useState(0);
  const fetch = useFetch();
const isBTC = symbol?.toUpperCase() === "BTCUSD";
const step = isBTC ? 0.001 : 0.1;
const precision = isBTC ? 3 : 1;

  const translations = {
    fr: {
      btnBuy: "Acheter",
      btnSell: "Vendre",
      btnClose: "Fermer",
      errQty: "Veillez saisir une quantité.",
      successOrder: "Votre ordre a été créé !",
      errOrder: "Erreur lors de l'ordre"
    },
    en: {
      btnBuy: "Buy",
      btnSell: "Sell",
      btnClose: "Close",
      errQty: "Please enter a quantity.",
      successOrder: "Your order has been created!",
      errOrder: "Error during the order"
    }
  };
  const t = translations[lang] || translations.fr;

  useEffect(() => {
    setCount(0);
  }, [open, symbol]);

const increment = () => {
  setCount(prev => {
    const nextVal = Number(prev) + step;
    if (nextVal >= maxCount) return Number(maxCount).toFixed(precision);
    return nextVal.toFixed(precision);
  });
};

const decrement = () => {
  setCount(prev => {
    const nextVal = Number(prev) - step;
    if (nextVal <= 0) return (0).toFixed(precision);
    return nextVal.toFixed(precision);
  });
};

const handleChange = (e) => {
  const val = e.target.value;
  if (val === "") { setCount(""); return; }

  const num = parseFloat(val);
  if (isNaN(num)) return;

  if (num > maxCount) {
    setCount(Number(maxCount).toFixed(precision));
  } else {
    setCount(val); 
  }
};
  const executeOrder = () => {
    let quantity = Number(count);
    if (quantity <= 0) {
      toast.error(t.errQty, {
        className: PopupStyles.toastError,
        progressClassName: PopupStyles.toastProgressError,
      });
      return;
    }

    const payload = {
      walletId: wallets[selectedId].id,
      symbol: symbol,
      amount: quantity.toFixed(precision),
      selling: sell ? "true" : "false",
    };
    
    fetch.post("/api/transactions", payload)
      .then(() => {
        toast.success(t.successOrder, {
          className: PopupStyles.toastSuccess,
          progressClassName: PopupStyles.toastProgressSuccess,
        });
        close();
      })
      .catch(() => {
        toast.error(t.errOrder, {
          className: PopupStyles.toastError,
          progressClassName: PopupStyles.toastProgressError,
        });
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

          <div className={PopupStyles.inputNumberWrapper}>
            <button className={PopupStyles.decrease} onClick={decrement}>
              -
            </button>
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
            <button className={PopupStyles.increase} onClick={increment}>
              +
            </button>
          </div>
          <button
            className={PopupStyles.buttonBuy}
            onClick={executeOrder}
          >
            {sell ? t.btnSell : t.btnBuy}
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