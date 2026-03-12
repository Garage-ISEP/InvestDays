import Head from "next/head";
import Image from "next/image";
import homeStyles from "../../styles/Home.module.css";
import DashBoardLayout from "../../components/layouts/DashBoard.layout";
import { useRouter } from "next/router";
import { useEffect, useState, useMemo } from "react";
import { useFetch } from "../../context/FetchContext.js";
import Popup from "../../components/Popup.component.jsx";
import { Request } from "../../types/request.type";
import { useWallet } from "../../context/WalletContext";
import { useLanguage } from "../../context/LanguageContext"; 
import Highcharts from "highcharts/highstock";
import HighchartsReact from "highcharts-react-official";
import { useAuthentification } from "../../context/AuthContext";

export default function DetailAction(req: Request) {
  const [data, setData] = useState<any>({ results: [] });
  const [isOpen, setIsOpen] = useState(false);
  const [detail, setDetail] = useState<any>({});
  const [chartReady, setChartReady] = useState(false);
  const [chartType, setChartType] = useState<"line" | "candlestick">("line");
  const [loadingChart, setLoadingChart] = useState(true);

  const { user, isAuthenticated } = useAuthentification();
  const { wallets, selectedId, getPrice } = useWallet();
  const { lang } = useLanguage();
  const router = useRouter();
  const { nameAction, name, market } = router.query;
  const fetch = useFetch();

  const translations = {
    fr: {
      cashLabel: "Disponible (P.",
      buyBtn: "Acheter",
      popTitle: "Acheter",
      popSub: "Achat de",
      loading: "Chargement du graphique...",
      noData: "Aucune donnée historique disponible.",
      line: "Courbe",
      candle: "Bougies",
    },
    en: {
      cashLabel: "Available (P.",
      buyBtn: "Buy",
      popTitle: "Buy",
      popSub: "Purchase of",
      loading: "Loading chart...",
      noData: "No historical data available.",
      line: "Line",
      candle: "Candlestick",
    }
  };

  const t = translations[lang as keyof typeof translations] || translations.fr;

  const lineData = useMemo(() => (data?.results || []).map((i: any) => [Number(i.t), i.c]), [data]);
  const candleData = useMemo(() => (data?.results || []).map((i: any) => [Number(i.t), i.o ?? i.c, i.h ?? i.c, i.l ?? i.c, i.c]), [data]);

  useEffect(() => {
    const initHC = async () => {
      if (typeof window !== "undefined") {
        try {
          const Exporting = await import("highcharts/modules/exporting");
          const factory = (Exporting as any).default || Exporting;
          if (typeof factory === 'function') factory(Highcharts);
          setChartReady(true);
        } catch (e) {
          setChartReady(true);
        }
      }
    };
    initHC();
  }, []);

  async function fetchDetail(symbol: string) {
    try {
      const response = await fetch.get("/api/stock/detail?symbol=" + symbol);
      const price = await getPrice(symbol);
      setDetail({ ...response.results, price });
    } catch (e) { console.error(e); }
  }

  async function fetchData(symbol: string) {
    setLoadingChart(true);
    const m = (market as string) || (router.query.market as string) || "stocks";
    try {
      const res = await fetch.get(`/api/stock/info?symbol=${symbol}&market=${m}`);
      setData(res || { results: [] });
    } catch (e) { setData({ results: [] }); }
    finally { setLoadingChart(false); }
  }

  useEffect(() => {
    if (router.isReady && user && isAuthenticated && nameAction) {
      fetchData(nameAction as string);
      fetchDetail(nameAction as string);
    }
  }, [router.isReady, nameAction, isAuthenticated, user]);

  useEffect(() => {
    if (!detail?.price && data?.results?.length > 0) {
      const lastPoint = data.results[data.results.length - 1];
      if (lastPoint?.c) setDetail((prev: any) => ({ ...prev, price: lastPoint.c }));
    }
  }, [data, detail?.price]);

  // Style des boutons : Taille moyenne
  const toggleBtnStyle = (active: boolean) => ({
    padding: '8px 18px', 
    borderRadius: '20px',
    border: 'none',
    cursor: 'pointer',
    fontWeight: '700' as const,
    fontSize: '12px', 
    transition: 'all 0.15s ease',
    backgroundColor: active ? '#f3ca3e' : '#f0f0f0',
    color: active ? '#1a1a1a' : '#888',
    boxShadow: active ? '0 2px 8px rgba(243,202,62,0.4)' : 'none',
  });

  const commonConfig: any = {
    chart: { height: 500, backgroundColor: 'transparent', animation: false },
    xAxis: { type: 'datetime', labels: { style: { color: '#888' } }, ordinal: true },
    yAxis: { labels: { style: { color: '#888' }, format: '{value}$' }, opposite: true, gridLineColor: '#f5f5f5' },
    rangeSelector: {
      selected: 3,
      inputStyle: { color: '#f3ca3e', fontWeight: '700' },
      labelStyle: { color: '#888' },
      buttonTheme: {
        fill: 'none', stroke: 'none', r: 8,
        style: { color: '#888', fontWeight: '600' },
        states: { select: { fill: '#f3ca3e', style: { color: '#000' } } }
      },
      buttons: [
        { type: 'month', count: 1, text: '1m' },
        { type: 'month', count: 3, text: '3m' },
        { type: 'all', text: lang === 'fr' ? 'Tout' : 'All' }
      ]
    },
    navigator: { enabled: true, maskFill: 'rgba(243, 202, 62, 0.05)', series: { color: '#f3ca3e' } },
    credits: { enabled: false },
    plotOptions: {
      line: { color: '#f3ca3e', lineWidth: 2 }, // Force le jaune pour toutes les lignes
      series: { animation: false }
    }
  };

  const hasData = chartType === "line" ? lineData.length > 0 : candleData.length > 0;

  return (
    <>
      <Head><title>InvestDays - {nameAction}</title></Head>

      <main className={homeStyles.pageContainer}>
        <div className={homeStyles.marketHeader}>
          <div>
            <h1 className={homeStyles.marketTitle}>{nameAction as string}</h1>
            <p className={homeStyles.marketSub}>
              {(name as string) || detail?.name || nameAction} • {
                detail?.price 
                  ? (detail.price < 0.1 
                      ? `${detail.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 })}$` 
                      : `${detail.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}$`)
                  : "- $"
              }
            </p>
          </div>

          <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
            <div className={homeStyles.statCard} style={{ display: 'flex', alignItems: 'center', padding: '12px 25px' }}>
              <Image 
                src="/assets/cash.svg" 
                width={25} 
                height={25} 
                alt="cash" 
                style={{ marginRight: '12px' }} 
              />
              <div>
                <span style={{ 
                  fontSize: '11px', 
                  color: '#888', 
                  display: 'block', 
                  textTransform: 'uppercase' 
                }}>
                  {t.cashLabel}{selectedId + 1})
                </span>
                <span style={{ 
                  fontWeight: '700', 
                  fontSize: '18px' 
                }}>
                  {(wallets[selectedId]?.cash || 0).toLocaleString()} $
                </span>
              </div>
            </div>
            <button className={homeStyles.buyButton} style={{ width: '160px', padding: '14px' }} onClick={() => setIsOpen(true)}>
              {t.buyBtn}
            </button>
          </div>
        </div>

        <div className={homeStyles.assetCard} style={{ minHeight: '600px' }}>
          
          <div className={homeStyles.filterBar} style={{ marginBottom: '25px', gap: '10px' }}>
            <button 
              onClick={() => setChartType("line")} 
              style={toggleBtnStyle(chartType === "line")}
            >
              📈 {t.line}
            </button>
            <button 
              onClick={() => setChartType("candlestick")} 
              style={toggleBtnStyle(chartType === "candlestick")}
            >
              🕯️ {t.candle}
            </button>
          </div>

          {loadingChart ? (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '450px', color: '#888' }}>
              {t.loading}
            </div>
          ) : chartReady && hasData ? (
            <HighchartsReact 
              key={`${nameAction}-${chartType}`} 
              highcharts={Highcharts} 
              constructorType={"stockChart"} 
              options={{
                ...commonConfig, 
                series: [
                  chartType === "line" 
                    ? { 
                        type: 'line', 
                        name: nameAction, 
                        data: lineData, 
                        color: '#f3ca3e',
                        lineColor: '#f3ca3e',  // ← ajoute ça
                        lineWidth: 2, 
                        tooltip: { valueDecimals: 4 } 
                      }
                    : { 
                        type: 'candlestick', 
                        name: nameAction, 
                        data: candleData, 
                        color: '#e74c3c', 
                        upColor: '#2ecc71', 
                        lineColor: '#e74c3c', 
                        upLineColor: '#2ecc71' 
                      }
                ]
              }} 
            />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '400px', textAlign: 'center' }}>
              <span style={{ fontSize: '50px', marginBottom: '10px' }}>📊</span>
              <p style={{ color: '#e74c3c', fontWeight: '800' }}>{t.noData}</p>
            </div>
          )}
        </div>

        <Popup 
          title={t.popTitle} 
          subtitle={`${t.popSub} ${nameAction}`} 
          maxCount={detail?.price ? Math.floor((wallets[selectedId]?.cash || 0) / detail.price) : 0} 
          symbol={nameAction as string} 
          sell={false} 
          open={isOpen} 
          close={() => setIsOpen(false)} 
          lang={lang} 
        />
      </main>
    </>
  );
}

DetailAction.getLayout = (page: any) => <DashBoardLayout>{page}</DashBoardLayout>;