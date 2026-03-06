import Head from "next/head";
import homeStyles from "../styles/Home.module.css";
import DashBoardLayout from "../components/layouts/DashBoard.layout";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { useWallet } from "../context/WalletContext";
import { useLanguage } from "../context/LanguageContext";
import { useFetch } from "../context/FetchContext.js";
import NextImage from "next/image";

export default function Home() {
  const router = useRouter();
  const { lang } = useLanguage();
  const fetch = useFetch();
  const { wallets, walletsLines, selectedId, actualiseWalletsLines, valuesCached } = useWallet();
  const [previousCloses, setPreviousCloses] = useState<{ [symbol: string]: number }>({});

  const translations = {
    fr: {
      title: "Bourse",
      sub: "Consultez et négociez des actions en temps réel",
      buy: "Acheter",
      sell: "Vendre",
      all: "Toutes les actions",
      tech: "Technologie",
      auto: "Automobile",
      fin: "Finance",
      empty: "Aucun actif dans ce portefeuille. Commencez à trader !",
      today: "variation (24h)",
      loading: "Chargement...",
      company: "Entreprise Cotée",
    },
    en: {
      title: "Stock Market",
      sub: "Browse and trade stocks in real-time",
      buy: "Buy",
      sell: "Sell",
      all: "All Stocks",
      tech: "Technology",
      auto: "Automotive",
      fin: "Finance",
      empty: "No assets in this portfolio. Start trading!",
      today: "change (24h)",
      loading: "Loading...",
      company: "Listed Company",
    }
  };

  const t = translations[lang as keyof typeof translations] || translations.fr;

  useEffect(() => {
    if (wallets && wallets[selectedId]) {
      actualiseWalletsLines(selectedId);
    }
  }, [wallets, selectedId]);

  useEffect(() => {
    if (!walletsLines?.[selectedId]) return;

    Object.values(walletsLines[selectedId]).forEach((line: any) => {
      fetch.get(`/api/stock/previousClose?symbol=${line.symbol}`)
        .then((price: number) => {
          if (price > 0) {
            setPreviousCloses(prev => ({ ...prev, [line.symbol]: price }));
          }
        })
        .catch(() => {});
    });
  }, [walletsLines, selectedId]);

  return (
    <>
      <Head>
        <title>InvestDays - {t.title}</title>
      </Head>

      <main className={homeStyles.pageContainer}>
        <div className={homeStyles.welcomeSection} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingRight: '0px' }}>
          <div>
            <h1 className={homeStyles.marketTitle}>{t.title}</h1>
            <p className={homeStyles.marketSub}>{t.sub}</p>
          </div>
          
        </div>

        <div className={homeStyles.filterBar}>
          <button className={homeStyles.filterActive}>{t.all}</button>
        </div>

        <div className={homeStyles.assetsGrid}>
          {walletsLines?.[selectedId] && Object.values(walletsLines[selectedId]).map((line: any, index: number) => {
            const currentPrice = valuesCached[line.symbol]?.value || 0;
            const previousClose = previousCloses[line.symbol] || currentPrice;
            const dailyPriceChange = currentPrice - previousClose;
            const dailyPercent = previousClose !== 0 && previousClose !== currentPrice
              ? (dailyPriceChange / previousClose) * 100
              : 0;
            const isPositive = dailyPriceChange >= 0;

            return (
              <div key={index} className={homeStyles.assetCard}>
                <div className={homeStyles.cardHeader}>
                  <div>
                    <span className={homeStyles.symbol}>{line.symbol}</span>
                    <p className={homeStyles.fullName} style={{ fontSize: '13px', color: '#888' }}>
                      {line.name || t.company}
                    </p>
                  </div>
                  <div
                    className={homeStyles.performanceBadge}
                    style={{
                      backgroundColor: isPositive ? '#e6f9f1' : '#fceae9',
                      color: isPositive ? '#2ecc71' : '#e36355',
                      fontWeight: '700'
                    }}
                  >
                    {isPositive ? '+' : ''}{dailyPercent.toFixed(2)}%
                  </div>
                </div>

                <div className={homeStyles.priceSection} style={{ marginTop: '20px' }}>
                  <div className={homeStyles.price} style={{ fontSize: '26px', fontWeight: '800' }}>
                    {currentPrice > 0 ? `$${currentPrice.toFixed(2)}` : t.loading}
                  </div>
                  <div
                    className={homeStyles.todayChange}
                    style={{ color: isPositive ? '#2ecc71' : '#e36355', fontSize: '14px', fontWeight: '600' }}
                  >
                    {isPositive ? '+$' : '-$'}{Math.abs(dailyPriceChange).toFixed(2)} {t.today}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                  <button
                    className={homeStyles.buyButton}
                    style={{ flex: 1 }}
                    onClick={() => router.push(`/market/${line.symbol}`)}
                  >
                    {t.buy}
                  </button>
                  <button
                    className={homeStyles.buyButton}
                    style={{ flex: 1, backgroundColor: '#e36355', color: 'white' }}
                    onClick={() => router.push('/wallet')}
                  >
                    {t.sell}
                  </button>
                </div>
              </div>
            );
          })}

          {(!walletsLines?.[selectedId] || Object.keys(walletsLines[selectedId]).length === 0) && (
            <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '60px' }}>
              <p style={{ color: '#888', fontSize: '16px' }}>{t.empty}</p>
            </div>
          )}
        </div>
      </main>
    </>
  );
}

Home.getLayout = function getLayout(page: any) {
  return <DashBoardLayout>{page}</DashBoardLayout>;
};