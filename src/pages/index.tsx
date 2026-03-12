import Head from "next/head";
import homeStyles from "../styles/Home.module.css";
import DashBoardLayout from "../components/layouts/DashBoard.layout";
import { useRouter } from "next/router";
import { useLanguage } from "../context/LanguageContext";
import { useWallet } from "../context/WalletContext";
import { useAuthentification } from "../context/AuthContext";

const STARTING_CASH = 10000;

export default function Home() {
  const router = useRouter();
  const { lang } = useLanguage();
  const { user } = useAuthentification();
  const { wallets, walletsLines, selectedId, valuesCached, assetsCached } = useWallet();

  const translations = {
    fr: {
      title: "Accueil",
      poweredBy: "Données fournies par",
      hello: "Bonjour",
      sub: "Bienvenue sur InvestDays",
      rulesTitle: "📋 Règles du Jeu",
      rulesSub: "Tout ce que vous devez savoir pour participer",
      rules: [
        { icon: "💰", title: "Capital de départ", desc: "Chaque joueur démarre avec 10 000 $ virtuels. Ce capital est identique pour tous — à vous d'en faire fructifier le maximum !" },
        { icon: "📈", title: "Acheter une action", desc: "Rendez-vous sur la page Marchés, recherchez un actif (action, crypto, forex) et passez un ordre d'achat. Le prix est celui du marché en temps réel." },
        { icon: "📉", title: "Vendre une action", desc: "Depuis votre Portefeuille, sélectionnez l'actif que vous souhaitez vendre et passez un ordre de vente. Vous ne pouvez vendre que ce que vous possédez." },
        { icon: "🏆", title: "Comment gagner", desc: "Le classement est basé sur votre profit/perte total. Plus votre capital a augmenté par rapport aux 10 000 $ de départ, plus vous montez dans le classement." },
        { icon: "👛", title: "Portefeuilles multiples", desc: "Vous pouvez créer jusqu'à 4 portefeuilles différents pour diversifier vos stratégies. Seul le meilleur portefeuille est pris en compte pour le classement." },
        { icon: "⏱️", title: "Horaires de marché", desc: "Les ordres sont exécutés uniquement lorsque les marchés sont ouverts. En dehors des horaires, vos ordres restent en attente jusqu'à la prochaine ouverture." },
        { icon: "⚠️", title: "Ordre refusé", desc: "Si vous n'avez pas assez de cash ou de titres en portefeuille, votre ordre sera automatiquement annulé. Vérifiez votre solde avant de trader !" },
        { icon: "📊", title: "Suivi de performance", desc: "Consultez la page Classement pour voir votre rang en temps réel et vous comparer aux autres investisseurs. La compétition est ouverte à tous !" },
        { icon: "🔒", title: "Argent virtuel uniquement", desc: "Tout l'argent utilisé sur InvestDays est 100% virtuel. Aucune transaction réelle n'est effectuée. Tradez sans risque et apprenez les marchés financiers !" },
        { icon: "🎓", title: "Objectif pédagogique", desc: "InvestDays est avant tout un outil d'apprentissage. L'objectif est de comprendre le fonctionnement des marchés financiers de manière ludique et interactive." },
      ],
      dashTitle: "📊 Mon Tableau de Bord",
      cashLabel: "Cash disponible",
      assetsLabel: "Valeur des actions",
      totalLabel: "Valeur totale",
      profitLabel: "Profit / Perte",
      portfolioTitle: "Mon Portefeuille",
      noAssets: "Aucune action détenue. Commencez à trader !",
      goMarket: "Aller aux marchés →",
      transactions: "Dernières transactions",
      noTx: "Aucune transaction pour l'instant.",
      buy: "ACHAT",
      sell: "VENTE",
      executed: "Exécuté",
      pending: "En attente",
      failed: "Échoué",
      quantity: "qté",
    },
    en: {
      title: "Home",
      poweredBy: "Market data by",
      hello: "Hello",
      sub: "Welcome to InvestDays",
      rulesTitle: "📋 Game Rules",
      rulesSub: "Everything you need to know to participate",
      rules: [
        { icon: "💰", title: "Starting Capital", desc: "Every player starts with $10,000 in virtual cash. The capital is identical for everyone — make it grow as much as possible!" },
        { icon: "📈", title: "Buying a Stock", desc: "Go to the Markets page, search for an asset (stock, crypto, forex) and place a buy order. The price is the real-time market price." },
        { icon: "📉", title: "Selling a Stock", desc: "From your Portfolio page, select the asset you want to sell and place a sell order. You can only sell what you own." },
        { icon: "🏆", title: "How to Win", desc: "The leaderboard is based on your total profit/loss. The more your capital has grown from the starting $10,000, the higher you rank." },
        { icon: "👛", title: "Multiple Portfolios", desc: "You can create up to 4 different portfolios to diversify your strategies. Only your best portfolio counts for the leaderboard." },
        { icon: "⏱️", title: "Market Hours", desc: "Orders are only executed when markets are open. Outside trading hours, your orders stay pending until the next market open." },
        { icon: "⚠️", title: "Rejected Order", desc: "If you don't have enough cash or shares, your order will be automatically cancelled. Check your balance before trading!" },
        { icon: "📊", title: "Performance Tracking", desc: "Check the Leaderboard page to see your rank in real-time and compare yourself with other investors. The competition is open to all!" },
        { icon: "🔒", title: "Virtual Money Only", desc: "All money used on InvestDays is 100% virtual. No real transactions are made. Trade risk-free and learn about financial markets!" },
        { icon: "🎓", title: "Educational Goal", desc: "InvestDays is first and foremost a learning tool. The goal is to understand how financial markets work in a fun and interactive way." },
      ],
      dashTitle: "📊 My Dashboard",
      cashLabel: "Available cash",
      assetsLabel: "Assets value",
      totalLabel: "Total value",
      profitLabel: "Profit / Loss",
      portfolioTitle: "My Portfolio",
      noAssets: "No assets held. Start trading!",
      goMarket: "Go to markets →",
      transactions: "Latest transactions",
      noTx: "No transactions yet.",
      buy: "BUY",
      sell: "SELL",
      executed: "Executed",
      pending: "Pending",
      failed: "Failed",
      quantity: "qty",
    }
  };

  const t = translations[lang as keyof typeof translations] || translations.fr;

  const currentWallet = wallets?.[selectedId];
  const cash = Number(currentWallet?.cash) || 0;
  const totalValue = cash + assetsCached;
  const profit = totalValue - STARTING_CASH;
  const profitPercent = ((profit / STARTING_CASH) * 100).toFixed(2);
  const isPositive = profit >= 0;

  const lines = walletsLines?.[selectedId]
    ? Object.values(walletsLines[selectedId]) as any[]
    : [];

  const recentTx = [...(currentWallet?.transactions || [])]
    .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  const statusColor: any = { EXECUTED: '#2ecc71', PENDING: '#f39c12', FAILED: '#e74c3c', CANCELLED: '#e74c3c' };
  const statusLabel: any = { EXECUTED: t.executed, PENDING: t.pending, FAILED: t.failed, CANCELLED: t.failed };

  return (
    <>
      <Head>
        <title>InvestDays - {t.title}</title>
        <link rel="icon" href="/favicon3.ico" />
      </Head>

      <main className={homeStyles.pageContainer}>
        {/* Bande jaune */}
        <div className={homeStyles.welcomeSection}>
          <div>
            <h1 className={homeStyles.marketTitle}>
              {t.hello} {(user as any)?.username || (user as any)?.email?.split('@')[0]} 👋
            </h1>
            <p className={homeStyles.marketSub}>{t.sub}</p>
          </div>
          <div className={homeStyles.partnerBrand}>
            <span style={{ fontSize: '11px', color: 'rgba(0,0,0,0.5)', fontWeight: '500' }}>{t.poweredBy}</span>
            <a href="https://finage.co.uk" target="_blank" rel="noreferrer">
              <img src="/assets/partners/finage_logo.svg" alt="Finage" style={{ height: '28px', objectFit: 'contain' }} />
            </a>
          </div>
        </div>

        {/* ── MON TABLEAU DE BORD ── */}
        <div className={homeStyles.sectionHeader} style={{ marginTop: '30px' }}>
          <h2 className={homeStyles.sectionTitle}>{t.dashTitle}</h2>
        </div>

        <div className={homeStyles.statsGrid}>
          <div className={homeStyles.statCard}>
            <div className={homeStyles.statLabel}>{t.cashLabel}</div>
            <div className={homeStyles.statValue}>
              {cash.toLocaleString(undefined, { minimumFractionDigits: 2 })} $
            </div>
          </div>
          <div className={homeStyles.statCard}>
            <div className={homeStyles.statLabel}>{t.assetsLabel}</div>
            <div className={homeStyles.statValue}>
              {assetsCached.toLocaleString(undefined, { minimumFractionDigits: 2 })} $
            </div>
          </div>
          <div className={homeStyles.statCard}>
            <div className={homeStyles.statLabel}>{t.totalLabel}</div>
            <div className={homeStyles.statValue}>
              {totalValue.toLocaleString(undefined, { minimumFractionDigits: 2 })} $
            </div>
          </div>
          <div className={homeStyles.statCard}>
            <div className={homeStyles.statLabel}>{t.profitLabel}</div>
            <div className={homeStyles.statValue} style={{ color: isPositive ? '#2ecc71' : '#e74c3c' }}>
              {isPositive ? '+' : ''}{profit.toLocaleString(undefined, { minimumFractionDigits: 2 })} $
            </div>
            <div style={{ fontSize: '12px', color: isPositive ? '#2ecc71' : '#e74c3c', marginTop: '2px' }}>
              {isPositive ? '+' : ''}{profitPercent}%
            </div>
          </div>
        </div>

        <div className={homeStyles.dashboardGrid}>
          <div className={homeStyles.panel}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '15px', fontWeight: '800', margin: 0 }}>{t.portfolioTitle}</h3>
              <button
                onClick={() => router.push('/market')}
                style={{ fontSize: '13px', color: '#c9a84c', fontWeight: '600', background: 'none', border: 'none', cursor: 'pointer' }}
              >
                {t.goMarket}
              </button>
            </div>
            {lines.length === 0 ? (
              <p style={{ color: '#888', fontSize: '14px', textAlign: 'center', padding: '20px 0' }}>{t.noAssets}</p>
            ) : (
              lines.map((line: any, i: number) => {
                const currentPrice = valuesCached[line.symbol]?.value || 0;
                const lineValue = line.quantity * currentPrice;
                const avgPrice = line.valueAtExecution?.length
                  ? line.valueAtExecution.reduce((sum: number, v: any) => sum + v.price * v.quantity, 0) /
                    line.valueAtExecution.reduce((sum: number, v: any) => sum + v.quantity, 0)
                  : 0;
                const lineProfit = avgPrice > 0 ? ((currentPrice - avgPrice) / avgPrice) * 100 : 0;
                const linePos = lineProfit >= 0;
                return (
                  <div key={i} className={homeStyles.assetRow}>
                    <div>
                      <div style={{ fontWeight: '700', fontSize: '14px' }}>{line.symbol}</div>
                      <div style={{ fontSize: '12px', color: '#888' }}>{line.quantity} {t.quantity} × {currentPrice.toFixed(2)} $</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontWeight: '700', fontSize: '14px' }}>{lineValue.toFixed(2)} $</div>
                      <div style={{ fontSize: '12px', color: linePos ? '#2ecc71' : '#e74c3c' }}>
                        {linePos ? '+' : ''}{lineProfit.toFixed(2)}%
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <div className={homeStyles.panel}>
            <h3 style={{ fontSize: '15px', fontWeight: '800', margin: '0 0 20px 0' }}>{t.transactions}</h3>
            {recentTx.length === 0 ? (
              <p style={{ color: '#888', fontSize: '14px', textAlign: 'center', padding: '20px 0' }}>{t.noTx}</p>
            ) : (
              recentTx.map((tx: any, i: number) => (
                <div key={i} className={homeStyles.txRow}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{
                      backgroundColor: tx.isSellOrder ? '#fceae9' : '#e6f9f1',
                      color: tx.isSellOrder ? '#e74c3c' : '#2ecc71',
                      fontSize: '11px', fontWeight: '700',
                      padding: '3px 8px', borderRadius: '6px'
                    }}>
                      {tx.isSellOrder ? t.sell : t.buy}
                    </span>
                    <div>
                      <div style={{ fontWeight: '700' }}>{tx.symbol}</div>
                      <div style={{ color: '#888', fontSize: '11px' }}>{tx.quantity} {t.quantity}</div>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: '700' }}>
                      {tx.valueAtExecution ? `${(tx.valueAtExecution * tx.quantity).toFixed(2)} $` : '—'}
                    </div>
                    <div style={{ fontSize: '11px', color: statusColor[tx.status] || '#888' }}>
                      {statusLabel[tx.status] || tx.status}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* ── RÈGLES DU JEU ── */}
        <div className={homeStyles.sectionHeader} style={{ marginTop: '50px' }}>
          <h2 className={homeStyles.sectionTitle}>{t.rulesTitle}</h2>
          <p className={homeStyles.sectionSub}>{t.rulesSub}</p>
        </div>
        
        <div className={homeStyles.rulesGrid}>
          {t.rules.map((rule, index) => (
            <div key={index} className={homeStyles.ruleCard}>
              <div style={{ fontSize: '26px' }}>{rule.icon}</div>
              <div style={{ fontSize: '14px', fontWeight: '700', color: '#1a1a1a' }}>{rule.title}</div>
              <div style={{ fontSize: '12px', color: '#666', lineHeight: '1.6' }}>{rule.desc}</div>
            </div>
          ))}
        </div>
      </main>
    </>
  );
}

Home.getLayout = function getLayout(page: any) {
  return <DashBoardLayout>{page}</DashBoardLayout>;
};