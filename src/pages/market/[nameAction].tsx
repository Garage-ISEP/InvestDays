import Head from "next/head";
import Image from "next/image";
import homeStyles from "../../styles/Home.module.css";
import DashBoardLayout from "../../components/layouts/DashBoard.layout";
import { useRouter } from "next/router";
import { useEffect, useState, useMemo, useRef } from "react";
import { useFetch } from "../../context/FetchContext.js";
import Popup from "../../components/Popup.component.jsx";
import { Request } from "../../types/request.type";
import { useWallet } from "../../context/WalletContext";
import { useLanguage } from "../../context/LanguageContext";
import Highcharts from "highcharts/highstock";
import HighchartsReact from "highcharts-react-official";
import { useAuthentification } from "../../context/AuthContext";

type TimeRange = "1H" | "1D" | "1W" | "1M" | "ALL";


function isEuronextOpen(): boolean {
  const now = new Date();
  const parisTime = new Date(now.toLocaleString("en-US", { timeZone: "Europe/Paris" }));
  const day = parisTime.getDay();
  const hours = parisTime.getHours();
  const minutes = parisTime.getMinutes();
  const timeInMinutes = hours * 60 + minutes;
  if (day === 0 || day === 6) return false;
  return timeInMinutes >= 540 && timeInMinutes < 1050;
}

function isNYSEOpen(): boolean {
  const now = new Date();
  const nyTime = new Date(now.toLocaleString("en-US", { timeZone: "America/New_York" }));
  const day = nyTime.getDay();
  const hours = nyTime.getHours();
  const minutes = nyTime.getMinutes();
  const timeInMinutes = hours * 60 + minutes;
  if (day === 0 || day === 6) return false;
  return timeInMinutes >= 570 && timeInMinutes < 960;
}

function isForexOpen(): boolean {
  const now = new Date();
  const day = now.getUTCDay(); 
  const hour = now.getUTCHours();
  if (day === 6) return false; 
  if (day === 5 && hour >= 22) return false; 
  if (day === 0 && hour < 22) return false;
  return true;
}

function getRangeMin(range: TimeRange): number | undefined {
  const now = Date.now();
  const map: Record<TimeRange, number | undefined> = {
    "1H":  now - 60 * 60 * 1000,
    "1D":  now - 24 * 60 * 60 * 1000,
    "1W":  now - 7  * 24 * 60 * 60 * 1000,
    "1M":  now - 30 * 24 * 60 * 60 * 1000,
    "ALL": undefined,
  };
  return map[range];
}


export default function DetailAction(req: Request) {
  const [data, setData] = useState<any>({ results: [] });
  const [isOpen, setIsOpen] = useState(false);
  const [detail, setDetail] = useState<any>({});
  const [chartType, setChartType] = useState<"line" | "candlestick">("line");
  const [range, setRange] = useState<TimeRange>("ALL");
  const [loadingChart, setLoadingChart] = useState(true);
  const [buyCooldown, setBuyCooldown] = useState(false);
const [cooldownSeconds, setCooldownSeconds] = useState(0);

  const chartRef = useRef<HighchartsReact.RefObject>(null);

  const { wallets, selectedId, getPrice } = useWallet();
  const { lang } = useLanguage();
  const router = useRouter();
  const { nameAction, name, market } = router.query;
  const fetch = useFetch();
  function startBuyCooldown() {
  setBuyCooldown(true);
  setCooldownSeconds(20);
  const interval = setInterval(() => {
    setCooldownSeconds(prev => {
      if (prev <= 1) {
        clearInterval(interval);
        setBuyCooldown(false);
        return 0;
      }
      return prev - 1;
    });
  }, 1000);
}


  const translations = {
    fr: { cashLabel: "Disponible (P.", buyBtn: "Acheter", popTitle: "Acheter", popSub: "Achat de", loading: "Chargement du graphique...", noData: "Données indisponibles", line: "Courbe", candle: "Bougies" },
    en: { cashLabel: "Available (P.", buyBtn: "Buy", popTitle: "Buy", popSub: "Purchase of", loading: "Loading chart...", noData: "No data available", line: "Line", candle: "Candlestick" }
  };
  const t = translations[lang as keyof typeof translations] || translations.fr;
const chartData = useMemo(() => {
  const results = data?.results || [];
  if (results.length === 0 && detail?.price) {
    const now = Date.now();
    const fallback = [
      [now - 3600000, detail.price],
      [now, detail.price]
    ];
    return { line: fallback, candle: fallback.map(p => [p[0], p[1], p[1], p[1], p[1]]) };
  }

  const line = results.map((i: any) => [Number(i.t), i.c]);
  const candle = results.map((i: any) => [
    Number(i.t), 
    i.o ?? i.c, 
    i.h ?? i.c, 
    i.l ?? i.c, 
    i.c
  ]);

  return { line, candle };
}, [data, detail?.price]);

async function fetchDetail(symbol: string) {
  try {
    const response = await fetch.get("/api/stock/detail?symbol=" + symbol);
    const price = await getPrice(symbol);
    const lastPriceRes = await fetch.get("/api/stock/lastPrice?symbol=" + symbol);

    const symbolUpper = symbol.toUpperCase();
    const forexPairs = ['EURUSD', 'USDJPY', 'GBPUSD', 'USDCHF', 'AUDUSD', 'USDCAD', 'NZDUSD', 'EURJPY', 'GBPJPY', 'EURGBP'];
    const europeanSuffixes = ['.PA', '.AS', '.BR', '.MI', '.MC', '.DE', '.L', '.SW'];

    const isForex = (market === "forex") || (market === "forex-fx") || forexPairs.includes(symbolUpper);
    const isCrypto = (market === "crypto") || (symbolUpper.endsWith("USD") && !forexPairs.includes(symbolUpper));
    const isEuropean = europeanSuffixes.some(suffix => symbolUpper.endsWith(suffix));

    let finalStatus = "closed";
    if (isCrypto) {
      finalStatus = "open";
    } else if (isForex) {
      finalStatus = isForexOpen() ? "open" : "closed";
    } else if (isEuropean) {
      finalStatus = lastPriceRes?.results?.[0]?.market_status || (isEuronextOpen() ? "open" : "closed");
    } else {
      finalStatus = lastPriceRes?.results?.[0]?.market_status || (isNYSEOpen() ? "open" : "closed");
    }

    setDetail({
      ...response.results,
      price,
      market_status: finalStatus
    });
  } catch (e) {
    console.error("Erreur dans fetchDetail", e);
  }
}
async function fetchData(symbol: string, marketParam?: string) {
  setLoadingChart(true);
  try {
    const m = marketParam || "stocks";
    const res = await fetch.get(`/api/stock/info?symbol=${symbol}&market=${m}&range=ALL`);
    setData(res || { results: [] });
  } catch (e) {
    setData({ results: [] });
  } finally {
    setLoadingChart(false);
  }
}
useEffect(() => {
  if (router.isReady && nameAction) {
    fetchData(nameAction as string, market as string);
    fetchDetail(nameAction as string);
  }
}, [router.isReady, nameAction, market]);


useEffect(() => {
  if (!nameAction) return;
  const interval = setInterval(() => {
    fetchDetail(nameAction as string);
  }, 5000); 
  return () => clearInterval(interval);
}, [nameAction]);

  const handleRangeChange = (newRange: TimeRange) => {
    setRange(newRange);
    if (chartRef.current && chartRef.current.chart) {
      const chart = chartRef.current.chart;
      const xAxis = chart.xAxis[0];
      let min = getRangeMin(newRange);

      if (newRange === "ALL") {
        const extremes = xAxis.getExtremes();
        min = extremes.dataMin; 
      }
      xAxis.setExtremes(min, Date.now());
    }
  };

  const commonConfig: any = {
    chart: { height: 500, backgroundColor: 'transparent', animation: false },
    accessibility: { enabled: false },
    xAxis: { 
        type: 'datetime', 
        ordinal: market !== 'crypto' && market !== 'forex',
        labels: { style: { color: '#888' } } 
    },
    yAxis: { 
        labels: { style: { color: '#888' }, format: '{value}$' }, 
        opposite: true, 
        gridLineColor: '#f5f5f5',
            startOnTick: false,
    endOnTick: false,
    threshold: null //
    },
    navigator: { 
        enabled: true, 
        maskFill: 'rgba(243, 202, 62, 0.05)', 
        series: { color: '#f3ca3e' } 
    },
    scrollbar: { enabled: true },
    credits: { enabled: false },
    rangeSelector: { enabled: false },
    plotOptions: { 
        series: { 
            animation: false, 
            dataGrouping: { enabled: false }, 
            getExtremesFromAll: true 
        } 
    }
  };

  const toggleBtnStyle = (active: boolean) => ({ padding: '8px 18px', borderRadius: '20px', border: 'none', cursor: 'pointer', fontWeight: '700' as const, fontSize: '12px', backgroundColor: active ? '#f3ca3e' : '#f0f0f0', color: active ? '#1a1a1a' : '#888' });
  const rangeBtnStyle = (active: boolean) => ({ padding: '6px 14px', borderRadius: '8px', cursor: 'pointer', fontSize: '11px', fontWeight: '800' as const, border: active ? '1px solid #f3ca3e' : '1px solid #eee', backgroundColor: active ? '#f3ca3e' : '#fff', color: active ? '#fff' : '#888' });

  return (
    <>
      <Head><title>Invest Days - {nameAction}</title>
              <link rel="icon" href="/favicon3.ico" /></Head>
      <main className={homeStyles.pageContainer}>
        <div className={homeStyles.marketHeader}>
          <div>
            <h1 className={homeStyles.marketTitle}>{nameAction as string}</h1>
            <p className={homeStyles.marketSub}>
              {(name as string) || detail?.name || nameAction} • {detail?.price?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 5 }) || "---"} $
              <span style={{ marginLeft: '12px', fontSize: '12px', color: detail?.market_status === 'open' ? '#2ecc71' : '#e74c3c', fontWeight: 'bold' }}>
                ● {detail?.market_status === 'open' ? 'MARCHÉ OUVERT' : 'MARCHÉ FERMÉ'}
              </span>
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
<button
  className={homeStyles.buyButton}
  style={{ width: '160px', opacity: (detail?.price && !buyCooldown) ? 1 : 0.5, cursor: buyCooldown ? 'not-allowed' : 'pointer' }}
  onClick={() => {
    if (!detail?.price || buyCooldown) return;
    startBuyCooldown();
    setIsOpen(true);
  }}
>
  {buyCooldown ? `${t.buyBtn} (${cooldownSeconds}s)` : t.buyBtn}
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
                <button key={r} onClick={() => handleRangeChange(r)} style={rangeBtnStyle(range === r)}>{r}</button>
              ))}
            </div>
          </div>

          <div id="tour-detail-chart-container">
            {loadingChart ? (
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '450px' }}>{t.loading}</div>
            ) : (
              <HighchartsReact
                ref={chartRef}
                key={`${nameAction}-${chartType}`}
                highcharts={Highcharts}
                constructorType={"stockChart"}
                options={{
                  ...commonConfig,
                  series: [{
                    type: chartType === "line" ? 'area' : 'candlestick',
                    name: nameAction,
                    data: chartType === "line" ? chartData.line : chartData.candle,
                    color: '#f3ca3e',
                    upColor: '#2ecc71',
                    downColor: '#e74c3c',
                    fillColor: chartType === "line" ? { 
                        linearGradient: { x1: 0, y1: 0, x2: 0, y2: 1 }, 
                        stops: [[0, 'rgba(243, 202, 62, 0.3)'], [1, 'rgba(243, 202, 62, 0)']] 
                    } : undefined
                  }]
                }}
              />
            )}
          </div>
        </div>


        <Popup
          subtitle={`${t.popSub} ${nameAction}`}
          maxCount={detail?.price ? (wallets[selectedId]?.cash || 0) / detail.price : 0}
          symbol={nameAction as string}
          sell={false}
          open={isOpen}
          close={() => setIsOpen(false)}
          lang={lang}
          isMarketOpen={detail?.market_status === "open"}
          onSellConfirm={null}
        />
      </main>
    </>
  );
}

DetailAction.getLayout = (page: any) => <DashBoardLayout>{page}</DashBoardLayout>;