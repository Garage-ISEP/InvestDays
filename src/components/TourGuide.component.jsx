import { useState, useEffect } from "react";
import { useRouter } from "next/router";

const TOUR_KEY = "investdays_tour_done";
const TOOLTIP_WIDTH = 280;

const steps_fr = [
  {
    target: "tour-accueil",
    title: "📊 Accueil",
    description: "Retrouvez vos statistiques, votre portefeuille et les règles du jeu.",
    position: "bottom",
  },
  {
    target: "tour-wallet",
    title: "👛 Portefeuille",
    description: "Consultez vos actions détenues, leur valeur actuelle et votre performance.",
    position: "bottom",
  },
  {
    target: "tour-market",
    title: "📈 Marchés",
    description: "Explorez les actions, cryptos et forex. Recherchez un actif et passez un ordre d'achat.",
    position: "bottom",
  },
  {
    target: "tour-ranking",
    title: "🏆 Classement",
    description: "Comparez votre performance avec les autres investisseurs en temps réel.",
    position: "bottom",
  },
  {
    target: "tour-portfolio-badge",
    title: "📁 Portefeuilles",
    description: "Vous pouvez avoir jusqu'à 4 portefeuilles. Cliquez sur 1, 2, 3 ou 4 pour switcher.",
    position: "bottom",
  },
  {
    target: "tour-lang",
    title: "🌍 Langue",
    description: "Basculez entre le français et l'anglais à tout moment.",
    position: "bottom-left",
  },
  {
    target: "tour-logout",
    title: "🔒 Déconnexion",
    description: "Cliquez ici pour vous déconnecter de votre compte.",
    position: "bottom-left",
  },
{
    target: "tour-stats",
    title: "💰 Vos indicateurs",
    description: "Suivez votre cash disponible, la valeur de vos titres et surtout votre profit/perte total.",
    position: "bottom",
  },
  {
    target: "tour-portfolio-preview",
    title: "💼 Aperçu rapide",
    description: "Un résumé de vos positions actuelles. Vous pouvez cliquer sur 'Aller aux marchés' pour trader.",
    position: "top",
  },
  {
    target: "tour-transactions",
    title: "📑 Historique",
    description: "Retrouvez ici vos 5 derniers ordres et vérifiez s'ils ont été bien exécutés.",
    position: "top",
  },
  {
    target: "tour-rules",
    title: "📜 Règles du jeu",
    description: "Prenez quelques minutes pour lire ces conseils, ils vous expliquent comment gagner le tournoi !",
    position: "top",
  },
  {
    target: "tour-wallet-stats",
    title: "💰 Résumé du compte",
    description: "Ici, vous voyez la valeur totale de ce portefeuille précis (Cash + Actions).",
    position: "bottom",
  },
  {
    target: "tour-wallet-actions",
    title: "➕ Gestion",
    description: "Créez jusqu'à 4 portefeuilles différents pour tester plusieurs stratégies ou allez directement aux marchés.",
    position: "bottom-left",
  },
  {
    target: "tour-wallet-table",
    title: "📋 Vos Positions",
    description: "C'est ici que s'afficheront vos actions après vos achats. Vous pourrez suivre leur gain ou perte en temps réel.",
    position: "top",
  },
  {
  target: "tour-market-info",
  title: "🚀 Explorez les marchés",
  description: "C'est ici que tout commence. Gardez un œil sur votre cash disponible avant d'investir.",
  position: "bottom",
},
{
  target: "tour-market-search",
  title: "🔍 Recherche",
  description: "Tapez le nom d'une entreprise ou son symbole (ex: AAPL pour Apple) pour trouver un actif.",
  position: "bottom",
},
{
  target: "tour-market-categories",
  title: "🏷️ Filtres",
  description: "Basculez rapidement entre les actions US, les cryptomonnaies ou le Forex.",
  position: "bottom",
},
{
  target: "tour-market-list",
  title: "📊 Liste des actifs",
  description: "Cliquez sur une ligne pour voir les détails de l'actif et passer votre premier ordre !",
  position: "top",
},

{
  target: "tour-detail-info",
  title: "📊 Analyse précise",
  description: "Ici vous voyez le prix en temps réel et les variations de l'actif sélectionné.",
  position: "bottom",
},
{
  target: "tour-detail-chart-type",
  title: "🕯️ Vue personnalisée",
  description: "Basculez entre une courbe simple ou des bougies japonaises pour une analyse plus technique.",
  position: "bottom",
},
{
  target: "tour-detail-chart-container",
  title: "📈 Historique",
  description: "Utilisez les boutons (1m, 3m, Tout) pour changer la période de temps affichée.",
  position: "top",
},
{
  target: "tour-detail-buy",
  title: "🎯 Passer un ordre",
  description: "Prêt à investir ? Cliquez ici pour ouvrir le formulaire d'achat et valider votre transaction.",
  position: "bottom-left",
},
{
  target: "tour-ranks-info",
  title: "🏆 Le Panthéon",
  description: "Découvrez qui sont les meilleurs investisseurs de la plateforme en temps réel.",
  position: "bottom",
},
{
  target: "tour-ranks-performance",
  title: "🥇 Votre position",
  description: "Retrouvez votre rang mondial, votre capital total et votre progression par rapport aux 10 000 $ de départ.",
  position: "bottom",
},
{
  target: "tour-ranks-table",
  title: "👥 Top Investisseurs",
  description: "Le classement est mis à jour en direct. Battez-vous pour atteindre le top du tableau !",
  position: "top",
},
];


const steps_en = [
  {
    target: "tour-accueil",
    title: "📊 Home",
    description: "Find your stats, portfolio summary and game rules.",
    position: "bottom",
  },
  {
    target: "tour-wallet",
    title: "👛 Portfolio",
    description: "See your held assets, current value and performance.",
    position: "bottom",
  },
  {
    target: "tour-market",
    title: "📈 Markets",
    description: "Browse stocks, crypto and forex. Search an asset and place a buy order.",
    position: "bottom",
  },
  {
    target: "tour-ranking",
    title: "🏆 Ranking",
    description: "Compare your performance with other investors in real time.",
    position: "bottom",
  },
  {
    target: "tour-portfolio-badge",
    title: "📁 Portfolios",
    description: "You can have up to 4 portfolios. Click 1, 2, 3 or 4 to switch between them.",
    position: "bottom",
  },
  {
    target: "tour-lang",
    title: "🌍 Language",
    description: "Switch between French and English at any time.",
    position: "bottom-left",
  },
  {
    target: "tour-logout",
    title: "🔒 Logout",
    description: "Click here to log out of your account.",
    position: "bottom-left",
  },
{
    target: "tour-stats",
    title: "💰 Your Metrics",
    description: "Track your available cash, asset value, and most importantly, your total profit/loss.",
    position: "bottom",
  },
  {
    target: "tour-portfolio-preview",
    title: "💼 Quick Preview",
    description: "A summary of your current holdings. Click 'Go to markets' to start trading.",
    position: "top",
  },
  {
    target: "tour-transactions",
    title: "📑 History",
    description: "Check your last 5 orders here and see if they were successfully executed.",
    position: "top",
  },
  {
    target: "tour-rules",
    title: "📜 Game Rules",
    description: "Take a few minutes to read these tips; they explain how to win the tournament!",
    position: "top",
  },
  {
    target: "tour-wallet-stats",
    title: "💰 Account Summary",
    description: "Here you can see the total value of this specific portfolio (Cash + Stocks).",
    position: "bottom",
  },
  {
    target: "tour-wallet-actions",
    title: "➕ Management",
    description: "Create up to 4 different portfolios to test multiple strategies or go straight to markets.",
    position: "bottom-left",
  },
  {
    target: "tour-wallet-table",
    title: "📋 Your Positions",
    description: "This is where your stocks will appear after purchase. You can track their gain or loss in real-time.",
    position: "top",
  },






  {
  target: "tour-market-info",
  title: "🚀 Explorez les marchés",
  description: "C'est ici que tout commence. Gardez un œil sur votre cash disponible avant d'investir.",
  position: "bottom",
},
{
  target: "tour-market-search",
  title: "🔍 Recherche",
  description: "Tapez le nom d'une entreprise ou son symbole (ex: AAPL pour Apple) pour trouver un actif.",
  position: "bottom",
},
{
  target: "tour-market-categories",
  title: "🏷️ Filtres",
  description: "Basculez rapidement entre les actions US, les cryptomonnaies ou le Forex.",
  position: "bottom",
},
{
  target: "tour-market-list",
  title: "📊 Liste des actifs",
  description: "Cliquez sur une ligne pour voir les détails de l'actif et passer votre premier ordre !",
  position: "top",
},


{
  target: "tour-detail-info",
  title: "📊 Analyse précise",
  description: "Ici vous voyez le prix en temps réel et les variations de l'actif sélectionné.",
  position: "bottom",
},
{
  target: "tour-detail-chart-type",
  title: "🕯️ Vue personnalisée",
  description: "Basculez entre une courbe simple ou des bougies japonaises pour une analyse plus technique.",
  position: "bottom",
},
{
  target: "tour-detail-chart-container",
  title: "📈 Historique",
  description: "Utilisez les boutons (1m, 3m, Tout) pour changer la période de temps affichée.",
  position: "top",
},
{
  target: "tour-detail-buy",
  title: "🎯 Passer un ordre",
  description: "Prêt à investir ? Cliquez ici pour ouvrir le formulaire d'achat et valider votre transaction.",
  position: "bottom-left",
},
{
  target: "tour-ranks-info",
  title: "🏆 Le Panthéon",
  description: "Découvrez qui sont les meilleurs investisseurs de la plateforme en temps réel.",
  position: "bottom",
},
{
  target: "tour-ranks-performance",
  title: "🥇 Votre position",
  description: "Retrouvez votre rang mondial, votre capital total et votre progression par rapport aux 10 000 $ de départ.",
  position: "bottom",
},
{
  target: "tour-ranks-table",
  title: "👥 Top Investisseurs",
  description: "Le classement est mis à jour en direct. Battez-vous pour atteindre le top du tableau !",
  position: "top",
},
];

export default function TourGuide({ lang = "fr" }) {
  const [active, setActive] = useState(false);
  const [step, setStep] = useState(0);
  const [spotlight, setSpotlight] = useState(null);
  const [tooltip, setTooltip] = useState({ top: 0, left: 0 });
  const router = useRouter();

  const steps = lang === "en" ? steps_en : steps_fr;

  useEffect(() => {
    if (!localStorage.getItem(TOUR_KEY)) {
      setTimeout(() => setActive(true), 800);
    }
  }, []);

  useEffect(() => {
    if (active) updatePositions();
  }, [active, step, router.asPath]);


function updatePositions() {
  const current = steps[step];
  const el = document.getElementById(current.target);
  if (!el) return;

  el.scrollIntoView({ behavior: "smooth", block: "center" });
  setTimeout(() => {
    const rect = el.getBoundingClientRect();
    const pad = 8;

    setSpotlight({
      top: Math.max(0, rect.top - pad),
      left: rect.left - pad,
      width: rect.width + pad * 2,
      height: rect.height + pad * 2,
    });

    let tooltipTop;
    const TOOLTIP_HEIGHT = 180; 

    if (current.position === "top") {
      tooltipTop = rect.top - TOOLTIP_HEIGHT - 20;
    } else {
      tooltipTop = rect.bottom + 16;
    }

    if (tooltipTop + TOOLTIP_HEIGHT > window.innerHeight) {
      tooltipTop = window.innerHeight - TOOLTIP_HEIGHT - 20;
    }

    tooltipTop = Math.max(90, tooltipTop);

    let tooltipLeft;
    if (current.position === "bottom-left") {
      tooltipLeft = rect.right - TOOLTIP_WIDTH;
    } else {
      tooltipLeft = rect.left + rect.width / 2 - TOOLTIP_WIDTH / 2;
    }
    tooltipLeft = Math.max(16, Math.min(tooltipLeft, window.innerWidth - TOOLTIP_WIDTH - 16));

    setTooltip({ top: tooltipTop, left: tooltipLeft });
  }, 300); 
}
function next() {
  const currentStep = steps[step];

  // Accueil -> Portefeuille
  if (currentStep.target === "tour-rules") {
    router.push("/wallet");
  }

  // Portefeuille -> Marchés
  if (currentStep.target === "tour-wallet-table") {
    router.push("/market");
  }

  // Marchés -> Détail (AAPL)
  if (currentStep.target === "tour-market-list") {
    router.push("/market/AAPL?market=stocks&name=Apple%20Inc.");
  }

  // Détail -> Classement (Nouvelle transition)
  if (currentStep.target === "tour-detail-buy") {
    router.push("/ranks");
  }

  if (step < steps.length - 1) {
    setStep((s) => s + 1);
  } else {
    finish();
  }
}

function prev() {
  const currentStep = steps[step];

  // Classement -> Détail (AAPL)
  if (currentStep.target === "tour-ranks-info") {
    router.push("/market/AAPL?market=stocks&name=Apple%20Inc.");
  }

  // Détail -> Marchés
  if (currentStep.target === "tour-detail-info") {
    router.push("/market");
  }

  // Marchés -> Portefeuille
  if (currentStep.target === "tour-market-info") {
    router.push("/wallet");
  }

  // Portefeuille -> Accueil
  if (currentStep.target === "tour-wallet-stats") {
    router.push("/");
  }

  if (step > 0) {
    setStep((s) => s - 1);
  }
}

  function finish() {
    localStorage.setItem(TOUR_KEY, "true");
    setActive(false);
  }

  if (!active || !spotlight) return null;

  const isLast = step === steps.length - 1;
  const current = steps[step];

  return (
    <>
      {/* Overlay avec spotlight */}
      <div style={{ position: "fixed", inset: 0, zIndex: 9998, pointerEvents: "all" }}>
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: spotlight.top, background: "rgba(0,0,0,0.65)" }} />
        <div style={{ position: "absolute", top: spotlight.top + spotlight.height, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.65)" }} />
        <div style={{ position: "absolute", top: spotlight.top, left: 0, width: spotlight.left, height: spotlight.height, background: "rgba(0,0,0,0.65)" }} />
        <div style={{ position: "absolute", top: spotlight.top, left: spotlight.left + spotlight.width, right: 0, height: spotlight.height, background: "rgba(0,0,0,0.65)" }} />
        <div style={{
          position: "absolute",
          top: spotlight.top,
          left: spotlight.left,
          width: spotlight.width,
          height: spotlight.height,
          borderRadius: 10,
          border: "2px solid #f3ca3e",
          boxShadow: "0 0 0 4px rgba(243,202,62,0.2)",
          pointerEvents: "none",
          transition: "all 0.3s ease",
        }} />
      </div>

      {/* Tooltip */}
      <div style={{
        position: "fixed",
        top: tooltip.top,
        left: tooltip.left,
        width: TOOLTIP_WIDTH,
        zIndex: 9999,
        background: "#fff",
        borderRadius: 14,
        padding: "16px 18px",
        boxShadow: "0 8px 32px rgba(0,0,0,0.18)",
        border: "1px solid #f0f0f0",
        animation: "fadeUp 0.25s ease",
      }}>
        <div style={{ display: "flex", gap: 4, marginBottom: 12 }}>
          {steps.map((_, i) => (
            <div key={i} style={{
              flex: 1, height: 3, borderRadius: 2,
              background: i <= step ? "#f3ca3e" : "#eee",
              transition: "background 0.3s",
            }} />
          ))}
        </div>

        <div style={{ fontSize: 15, fontWeight: 800, color: "#1a1a1a", marginBottom: 6 }}>
          {current.title}
        </div>
        <div style={{ fontSize: 13, color: "#555", lineHeight: 1.6, marginBottom: 16 }}>
          {current.description}
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <button onClick={finish} style={{ fontSize: 12, color: "#aaa", background: "none", border: "none", cursor: "pointer", padding: 0 }}>
            {lang === "en" ? "Skip" : "Passer"}
          </button>
          <div style={{ display: "flex", gap: 8 }}>
            {step > 0 && (
              <button onClick={prev} style={{ padding: "7px 14px", borderRadius: 8, border: "1.5px solid #e0e0e0", background: "#fff", cursor: "pointer", fontSize: 13, fontWeight: 600, color: "#555" }}>
                ←
              </button>
            )}
            <button onClick={next} style={{ padding: "7px 16px", borderRadius: 8, border: "none", background: "#f3ca3e", cursor: "pointer", fontSize: 13, fontWeight: 700, color: "#1a1a1a" }}>
              {isLast ? (lang === "en" ? "Finish ✓" : "Terminer ✓") : (lang === "en" ? "Next →" : "Suivant →")}
            </button>
          </div>
        </div>

        <div style={{ textAlign: "center", fontSize: 11, color: "#ccc", marginTop: 10 }}>
          {step + 1} / {steps.length}
        </div>
      </div>

      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </>
  );
}