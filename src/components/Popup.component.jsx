import React, { useEffect, useState, useRef } from "react";
import styles from "../styles/Popup.module.css";
import { useFetch } from "../context/FetchContext.js";
import { useWallet } from "../context/WalletContext";
import { toast } from "react-toastify";

function Popup({
  subtitle,
  sell,
  symbol,
  maxCount = 10000,
  open,
  close,
  lang,
  isMarketOpen = true,
  onSellConfirm,
}) {
  const { wallets, selectedId, actualiseWalletsLines } = useWallet();
  const [count, setCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0); // Temps restant en secondes
  const timerRef = useRef(null);
  const fetch = useFetch();

  const isCrypto = symbol?.toUpperCase().includes("USD") && !symbol?.toUpperCase().includes(".PA");
  const precision = isCrypto ? 4 : 1; 
  const step = isCrypto ? 0.001 : 1;

  const translations = {
    fr: {
      btnBuy: "Acheter",
      btnSell: "Vendre",
      btnClose: "Fermer la fenêtre",
      successOrder: "Ordre exécuté avec succès !",
      successOrderPending: "Ordre enregistré (En attente d'ouverture)",
      errOrder: "Erreur lors de la transaction",
      marketClosed: "Le marché est actuellement fermé. Votre ordre sera exécuté à la prochaine ouverture.",
      btn_sell_all: "Vendre tout",
      btn_place_order: "Placer l'ordre",
      wait: "Attendre"
    },
    en: {
      btnBuy: "Buy",
      btnSell: "Sell",
      btnClose: "Close window",
      successOrder: "Order executed successfully!",
      successOrderPending: "Order placed (Pending market open)",
      errOrder: "Transaction error",
      marketClosed: "Market is closed. Your order will execute at next opening.",
      btn_sell_all: "Sell all",
      btn_place_order: "Place order",
      wait: "Wait"
    },
  };
  const t = translations[lang] || translations.fr;

  // Gestion du compte à rebours de 15s
  useEffect(() => {
    if (cooldown > 0) {
      timerRef.current = setInterval(() => {
        setCooldown((prev) => prev - 1);
      }, 1000);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [cooldown]);

  useEffect(() => {
    if (open) {
      setCount(0);
      setIsLoading(false);
    }
  }, [open, symbol]);

  const increment = () => setCount(prev => Math.min(Number(prev) + step, maxCount).toFixed(precision));
  const decrement = () => setCount(prev => Math.max(Number(prev) - step, 0).toFixed(precision));

  const executeOrder = () => {
    const quantity = Number(count);
    
    // SÉCURITÉ : On bloque si : pas de quantité, déjà en cours, ou en cooldown
    if (quantity <= 0 || isLoading || cooldown > 0) return;
    
    setIsLoading(true);
    const payload = {
      walletId: wallets[selectedId].id,
      symbol: symbol,
      amount: quantity.toFixed(precision),
      selling: sell ? "true" : "false",
      status: isMarketOpen ? "EXECUTED" : "PENDING" 
    };

    fetch.post("/api/transactions", payload)
      .then(() => {
        if (sell && onSellConfirm) onSellConfirm(symbol, quantity, maxCount);
        toast.success(isMarketOpen ? t.successOrder : t.successOrderPending);
        actualiseWalletsLines();
        
        // On lance le cooldown de 15 secondes après un succès
        setCooldown(15); 
        
        // Optionnel : fermer la fenêtre après un délai pour que l'utilisateur voie le succès
        setTimeout(() => close(), 1000);
      })
      .catch(() => {
        toast.error(t.errOrder);
        // On lance aussi le cooldown en cas d'erreur pour éviter le spam d'erreurs
        setCooldown(15);
      })
      .finally(() => setIsLoading(false));
  };

  if (!open) return null;

  const getButtonText = () => {
    if (isLoading) return "...";
    if (cooldown > 0) return `${t.wait} (${cooldown}s)`;
    if (sell) return t.btnSell;
    return isMarketOpen ? t.btnBuy : t.btn_place_order;
  };

  return (
    <div className={styles.modalBackdrop}>
      <div className={styles.modal}>
        <div className={styles.modalContent}>
          <div className={styles.modalTitle}>
            <h1>{symbol}</h1>
            <span className={styles.modalSubtitle}>{subtitle}</span>
          </div>

          {!isMarketOpen && (
            <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "14px", padding: "12px", fontSize: "0.8rem", color: "#64748b", marginBottom: "20px", textAlign: "center" }}>
              <span style={{ marginRight: "6px" }}>⏳</span>{t.marketClosed}
            </div>
          )}

          <div className={styles.inputNumberWrapper}>
            <button onClick={decrement} disabled={cooldown > 0}>−</button>
            <input
              type="number"
              value={count}
              disabled={cooldown > 0}
              onChange={(e) => setCount(e.target.value)}
              onBlur={() => setCount(Math.min(Math.max(Number(count), 0), maxCount).toFixed(precision))}
            />
            <button onClick={increment} disabled={cooldown > 0}>+</button>
          </div>

          {sell && (
            <button className={styles.sellAllLink} onClick={() => setCount(Number(maxCount).toFixed(precision))}>
              {t.btn_sell_all} ({Number(maxCount).toFixed(precision)})
            </button>
          )}

          <button
            className={styles.buttonBuy}
            onClick={executeOrder}
            disabled={isLoading || cooldown > 0 || Number(count) <= 0}
            style={{
              ...(sell ? { background: "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)" } : {}),
              ...(!isMarketOpen && !sell ? { background: "#94a3b8" } : {}),
              // Style quand désactivé par le cooldown
              ...(cooldown > 0 || isLoading ? { opacity: 0.6, cursor: "not-allowed", filter: "grayscale(0.8)" } : {})
            }}
          >
            {getButtonText()}
          </button>

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