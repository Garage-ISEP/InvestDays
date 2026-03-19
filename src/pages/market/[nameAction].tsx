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

type TimeRange = "1H" | "1D" | "1W" | "1M" | "ALL";

export default function DetailAction(req: Request) {
  const [data, setData] = useState<any>({ results: [] });
  const [isOpen, setIsOpen] = useState(false);
  const [detail, setDetail] = useState<any>({});
  const [chartType, setChartType] = useState<"line" | "candlestick">("line");
  const [range, setRange] = useState<TimeRange>("1M");
  const [loadingChart, setLoadingChart] = useState(true);

  const { user, isAuthenticated } = useAuthentification();
  const { wallets, selectedId, getPrice } = useWallet();
  const { lang } = useLanguage();
  const router = useRouter();
  const { nameAction, name, market } = router.query;
  const fetch = useFetch();

  const translations = {
    fr: { cashLabel: "Disponible (P.", buyBtn: "Acheter", popTitle: "Acheter", popSub: "Achat de", loading: "Chargement du graphique...", noData: "Données indisponibles", line: "Courbe", candle: "Bougies" },
    en: { cashLabel: "Available (P.", buyBtn: "Buy", popTitle: "Buy", popSub: "Purchase of", loading: "Loading chart...", noData: "No data available", line: "Line", candle: "Candlestick" }
  };
  const t = translations[lang as keyof typeof translations] || translations.fr;
  const chartData = useMemo(() => {
    let results = data?.results ? [...data.results] : [];
    
    if (results.length === 0 && detail?.price) {
      const now = Date.now();
      const startTime = now - (24 * 60 * 60 * 1000); 
      results = [
        { t: startTime, c: detail.price, o: detail.price, h: detail.price, l: detail.price },
        { t: now, c: detail.price, o: detail.price, h: detail.price, l: detail.price }
      ];
    } else if (results.length > 0 && detail?.price) {
      results.push({ t: Date.now(), c: detail.price, o: detail.price, h: detail.price, l: detail.price });
    }

    const line = results.map((i: any) => [Number(i.t), i.c]);
    const candle = results.map((i: any) => [Number(i.t), i.o ?? i.c, i.h ?? i.c, i.l ?? i.c, i.c]);
    return { line, candle };
  }, [data, detail?.price]);

  const getXAxisRange = () => {
    switch (range) {
      case "1H": return 3600 * 1000;
      case "1D": return 24 * 3600 * 1000;
      case "1W": return 7 * 24 * 3600 * 1000;
      case "1M": return 30 * 24 * 3600 * 1000;
      default: return undefined;
    }
  };

  async function fetchDetail(symbol: string) {
    try {
      const response = await fetch.get("/api/stock/detail?symbol=" + symbol);
      const price = await getPrice(symbol);
      setDetail({ ...response.results, price });
    } catch (e) {}
  }

  async function fetchData(symbol: string, selectedRange: TimeRange) {
    setLoadingChart(true);
    try {
      const m = (market as string) || "stocks";
      const res = await fetch.get(`/api/stock/info?symbol=${symbol}&market=${m}&range=${selectedRange}`);
      setData(res || { results: [] });
    } catch (e) { setData({ results: [] }); }
    finally { setLoadingChart(false); }
  }

  useEffect(() => {
    if (router.isReady && nameAction) {
      fetchData(nameAction as string, range);
      fetchDetail(nameAction as string);
    }
  }, [router.isReady, nameAction, range]);

  useEffect(() => {
    if (!nameAction) return;
    const interval = setInterval(async () => {
      const price = await getPrice(nameAction as string);
      if (price) setDetail((prev: any) => ({ ...prev, price }));
    }, 30000);
    return () => clearInterval(interval);
  }, [nameAction, getPrice]);

  const toggleBtnStyle = (active: boolean) => ({ padding: '8px 18px', borderRadius: '20px', border: 'none', cursor: 'pointer', fontWeight: '700' as const, fontSize: '12px', backgroundColor: active ? '#f3ca3e' : '#f0f0f0', color: active ? '#1a1a1a' : '#888' });
  const rangeBtnStyle = (active: boolean) => ({ padding: '6px 14px', borderRadius: '8px', cursor: 'pointer', fontSize: '11px', fontWeight: '800' as const, border: active ? '1px solid #f3ca3e' : '1px solid #eee', backgroundColor: active ? '#f3ca3e' : '#fff', color: active ? '#fff' : '#888' });

  const commonConfig: any = {
    chart: { height: 500, backgroundColor: 'transparent', animation: false },
    accessibility: { enabled: false },
    xAxis: { type: 'datetime', ordinal: market !== 'crypto', range: getXAxisRange(), labels: { style: { color: '#888' } } },
    yAxis: { labels: { style: { color: '#888' }, format: '{value}$' }, opposite: true, gridLineColor: '#f5f5f5' },
    rangeSelector: { enabled: false },
    navigator: { enabled: true, maskFill: 'rgba(243, 202, 62, 0.05)', series: { color: '#f3ca3e' } },
    scrollbar: { enabled: true },
    credits: { enabled: false },
    plotOptions: { series: { animation: false, dataGrouping: { enabled: range === "ALL" } } }
  };

  return (
    <>
      <Head><title>Invest Days - {nameAction}</title>
      <link rel="icon" href="/favicon3.ico" />
      </Head>
      <main className={homeStyles.pageContainer}>
        <div className={homeStyles.marketHeader}>
          <div>
            <h1 className={homeStyles.marketTitle}>{nameAction as string}</h1>
            <p className={homeStyles.marketSub}>
              {(name as string) || detail?.name || nameAction} • {
                detail?.price 
                  ? `${detail.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 5 })}$` 
                  : "Prix indisponible"
              }
            </p>
          </div>
          <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
            <div className={homeStyles.statCard} style={{ display: 'flex', alignItems: 'center', padding: '12px 25px' }}>
              <Image src="/assets/cash.svg" width={25} height={25} alt="cash" style={{ marginRight: '12px' }} />
              <div>
                <span style={{ fontSize: '11px', color: '#888', display: 'block' }}>{t.cashLabel}{selectedId + 1})</span>
                <span style={{ fontWeight: '700', fontSize: '18px' }}>{(wallets[selectedId]?.cash || 0).toLocaleString()} $</span>
              </div>
            </div>
            <button className={homeStyles.buyButton} style={{ width: '160px', opacity: detail?.price ? 1 : 0.5 }} onClick={() => detail?.price && setIsOpen(true)}>
              {t.buyBtn}
            </button>
          </div>
        </div>

        <div className={homeStyles.assetCard} style={{ minHeight: '600px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '25px', alignItems: 'center' }}>
            <div style={{ display: 'flex', gap: '10px' }}>
                <button onClick={() => setChartType("line")} style={toggleBtnStyle(chartType === "line")}>📈 {t.line}</button>
                <button onClick={() => setChartType("candlestick")} style={toggleBtnStyle(chartType === "candlestick")}>🕯️ {t.candle}</button>
            </div>
            <div style={{ display: 'flex', gap: '6px' }}>
                {(["1H", "1D", "1W", "1M", "ALL"] as TimeRange[]).map((r) => (
                    <button key={r} onClick={() => setRange(r)} style={rangeBtnStyle(range === r)}>{r}</button>
                ))}
            </div>
          </div>

          <div id="tour-detail-chart-container">
            {loadingChart ? (
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '450px' }}>{t.loading}</div>
            ) : chartData.line.length > 0 ? (
              <HighchartsReact 
                key={`${nameAction}-${chartType}-${range}`} 
                highcharts={Highcharts} 
                constructorType={"stockChart"} 
                options={{
                  ...commonConfig, 
                  series: [{ 
                    type: chartType === "line" ? 'area' : 'candlestick', 
                    name: nameAction, 
                    data: chartType === "line" ? chartData.line : chartData.candle, 
                    color: chartType === "line" ? '#f3ca3e' : '#e74c3c',
                    upColor: '#2ecc71',
                    fillColor: chartType === "line" ? { linearGradient: { x1: 0, y1: 0, x2: 0, y2: 1 }, stops: [[0, 'rgba(243, 202, 62, 0.3)'], [1, 'rgba(243, 202, 62, 0.0)']] } : undefined
                  }]
                }} 
              />
            ) : (
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>{t.noData}</div>
            )}
          </div>
        </div>
        <Popup 
          title={t.popTitle} 
          subtitle={`${t.popSub} ${nameAction}`} 
          maxCount={detail?.price ? (wallets[selectedId]?.cash || 0) / detail.price : 0} 
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