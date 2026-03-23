import Head from "next/head";
import Image from "next/image";
import { useEffect, useState, useCallback } from "react";
import { useFetch } from "../../context/FetchContext.js";
import { useWallet } from "../../context/WalletContext";
import { useLanguage } from "../../context/LanguageContext";

import homeStyles from "../../styles/Home.module.css";
import marketStyles from "../../styles/Market.module.css";
import TableSearch from "../../components/TableSearch.component.jsx";
import DashBoardLayout from "../../components/layouts/DashBoard.layout";

const MARKET_TO_TYPE: Record<string, string> = {
  stocks: "us-stock",
  crypto: "crypto",
  forex:  "forex",
};

export default function Market() {
  const { wallets, selectedId, selectWallet } = useWallet();
  const { lang } = useLanguage();
  const fetch = useFetch();

  const [input, setInput]                 = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [marketFilter, setMarketFilter]   = useState("all");
  const [symbols, setSymbols]             = useState<any[]>([]);
  const [page, setPage]                   = useState(1);
  const [loading, setLoading]             = useState(false);
  const [hasMore, setHasMore]             = useState(true);

  const translations = {
    fr: {
      headTitle:      "Invest Days - Marchés",
      title:          "Marchés",
      sub:            "Recherchez et analysez les actions en temps réel via Finage",
      cashLabel:      "Disponible",
      portfolioLabel: "Portefeuille n°",
      placeholder:    "Tapez le nom d'une entreprise...",
      noWarrants:     "warrant",
      filterAll:      "Tous",
      filterStocks:   "Actions",
      filterCrypto:   "Crypto",
      filterForex:    "Forex",
      prev:           "← Précédent",
      next:           "Suivant →",
      pageLabel:      "Page",
      loading:        "Chargement...",
      noResults:      "Aucun résultat",
    },
    en: {
      headTitle:      "Invest Days - Markets",
      title:          "Markets",
      sub:            "Search and analyze stocks in real-time via Finage",
      cashLabel:      "Available",
      portfolioLabel: "Portfolio #",
      placeholder:    "Type a company name...",
      noWarrants:     "warrant",
      filterAll:      "All",
      filterStocks:   "Stocks",
      filterCrypto:   "Crypto",
      filterForex:    "Forex",
      prev:           "← Previous",
      next:           "Next →",
      pageLabel:      "Page",
      loading:        "Loading...",
      noResults:      "No results",
    }
  };

  const t = translations[lang as keyof typeof translations] || translations.fr;

  const loadSymbols = useCallback(async (filter: string, p: number) => {
    setLoading(true);
    try {
      if (filter === "all") {
        const [stocksRes, cryptoRes, forexRes] = await Promise.allSettled([
          fetch.get(`/api/stock/symbols?type=us-stock&page=${p}&limit=10`),
          fetch.get(`/api/stock/symbols?type=crypto&page=${p}&limit=10`),
          fetch.get(`/api/stock/symbols?type=forex&page=${p}&limit=10`),
        ]);

        const stocks = stocksRes.status === "fulfilled" ? (stocksRes.value?.symbols || []).slice(0, 8) : [];
        const crypto = cryptoRes.status === "fulfilled" ? (cryptoRes.value?.symbols || []).slice(0, 6) : [];
        const forex  = forexRes.status  === "fulfilled" ? (forexRes.value?.symbols  || []).slice(0, 6) : [];

        const combined = [...stocks, ...crypto, ...forex];
        setSymbols(combined);
        setHasMore(combined.length > 0);
      } else {
        const type = MARKET_TO_TYPE[filter] || "us-stock";
        const res = await fetch.get(`/api/stock/symbols?type=${type}&page=${p}&limit=20`);
        
        const list = (res?.symbols || []).slice(0, 20); 
        setSymbols(list);
        setHasMore((res?.symbols || []).length > 0);
      }
    } catch (err) {
      console.error("Load symbols error:", err);
      setSymbols([]);
      setHasMore(false);
    } finally {
      setLoading(false);
    }
  }, [fetch]);

  useEffect(() => {
    if (!input.trim()) {
      loadSymbols(marketFilter, page);
    }
  }, [marketFilter, page, input, loadSymbols]);

  function handleFilterChange(key: string) {
    setMarketFilter(key);
    setPage(1);
    setInput("");
    setSearchResults([]);
  }

  useEffect(() => {
    const delay = setTimeout(() => {
      if (input.trim().length > 1) {
        fetch.get("/api/stock/search?term=" + input)
          .then((results) => setSearchResults(results || []))
          .catch((err) => console.error("Search Error:", err));
      } else {
        setSearchResults([]);
      }
    }, 600);
    return () => clearTimeout(delay);
  }, [input, fetch]);

  const onChange = (e: any) => setInput(e.target.value);
  const handleKeyDown = (e: any) => {
    if (e.key === "Escape") { setInput(""); setSearchResults([]); }
  };

  const isSearching = input.trim().length > 1;
  const baseList = isSearching ? searchResults : symbols;
  const displayList = baseList
    .filter((item: any) => {
      const name = (item.name || "").toLowerCase();
      const symbol = (item.symbol || "").toLowerCase();
      const warrantTerm = t.noWarrants.toLowerCase();
      const bannedKeywords = ["anti", "0xbtc", "0xbitcoin","btcone", "bitcoinote", "bitcoin 2","bitcoin 3","bitcoin adult", "bitcoin air","bether","ethos","ethplode"];

      const isBanned = bannedKeywords.some(keyword => 
        name.includes(keyword) || symbol.includes(keyword)
      );

      const isWarrant = name.includes(warrantTerm);

      return !isBanned && !isWarrant;
    })
    .map((item: any) => ({
      symbol: item.symbol,
      name: item.name,
      market: item.market || (isSearching ? "stocks" : "")
    }));

  const filters = [
    { key: "all",    label: t.filterAll },
    { key: "stocks", label: t.filterStocks },
    { key: "crypto", label: t.filterCrypto },
    { key: "forex",  label: t.filterForex },
  ];

  const btnStyle = (active: boolean) => ({
    padding: '8px 20px',
    borderRadius: '20px',
    border: 'none',
    cursor: 'pointer',
    fontWeight: '700' as const,
    fontSize: '13px',
    transition: 'all 0.15s ease',
    backgroundColor: active ? '#f3ca3e' : '#f0f0f0',
    color: active ? '#1a1a1a' : '#888',
    boxShadow: active ? '0 2px 8px rgba(243,202,62,0.4)' : 'none',
  });

  return (
    <>
      <Head>
        <title>{t.headTitle}</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon3.ico" />
      </Head>

      <main className={homeStyles.pageContainer}>

        {/* Header */}
        <div id="tour-market-info" className={homeStyles.marketHeader} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
          <div>
            <h1 className={homeStyles.marketTitle}>{t.title}</h1>
            <p className={homeStyles.marketSub}>{t.sub}</p>
          </div>
          <div className={homeStyles.statCard} style={{ display: 'flex', alignItems: 'center', padding: '12px 25px' }}>
            <Image src="/assets/cash.svg" width={25} height={25} alt="cash" style={{ marginRight: '12px' }} />
            <div>
              <span style={{ fontSize: '11px', color: '#888', display: 'block', textTransform: 'uppercase' }}>{t.cashLabel}</span>
              <span style={{ fontWeight: '700', fontSize: '18px' }}>{(wallets[selectedId]?.cash || 0).toLocaleString()} $</span>
            </div>
          </div>
        </div>

        {/* Filtres portefeuille */}
        <div className={homeStyles.filterBar} style={{ marginBottom: '20px' }}>
          {wallets.map((_, index) => (
            <button
              key={index}
              className={selectedId === index ? homeStyles.filterActive : homeStyles.filterItem}
              onClick={() => selectWallet(index)}
            >
              {t.portfolioLabel}{index + 1}
            </button>
          ))}
        </div>

        {/* Barre de recherche */}
        <div id="tour-market-search" className={marketStyles.searchInput} style={{ width: '100%', maxWidth: '600px', margin: '0 auto 20px' }}>
          <div style={{ borderRadius: '15px', border: '2px solid #f3ca3e', backgroundColor: 'white', display: 'flex', alignItems: 'center', padding: '0 15px', gap: '10px' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#aaa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="text"
              placeholder={t.placeholder}
              value={input}
              onChange={onChange}
              onKeyDown={handleKeyDown}
              style={{ height: '50px', border: 'none', width: '100%', outline: 'none', fontSize: '16px', backgroundColor: 'transparent' }}
            />
            {input && (
              <button onClick={() => { setInput(""); setSearchResults([]); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#aaa', fontSize: '18px', lineHeight: 1 }}>
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Filtres marché */}
        <div id="tour-market-categories" style={{ display: 'flex', gap: '10px', justifyContent: 'center', marginBottom: '30px', flexWrap: 'wrap' }}>
          {filters.map((f) => (
            <button key={f.key} onClick={() => handleFilterChange(f.key)} style={btnStyle(marketFilter === f.key)}>
              {f.label}
            </button>
          ))}
        </div>

        {/* Tableau */}
        <div id="tour-market-list" className={homeStyles.assetCard} style={{ padding: '0', overflow: 'hidden', borderRadius: '15px' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '60px', color: '#aaa', fontSize: '14px' }}>
              {t.loading}
            </div>
          ) : displayList.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px', color: '#aaa', fontSize: '14px' }}>
              {t.noResults}
            </div>
          ) : (
            <TableSearch data={displayList} lang={lang} />
          )}
        </div>

        {/* Pagination — cachée pendant une recherche */}
        {!isSearching && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '16px', marginTop: '24px' }}>
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1 || loading}
              style={{
                ...btnStyle(page > 1),
                opacity: page === 1 ? 0.4 : 1,
                cursor: page === 1 ? 'not-allowed' : 'pointer',
              }}
            >
              {t.prev}
            </button>

            <span style={{ fontWeight: '700', fontSize: '14px', color: '#555' }}>
              {t.pageLabel} {page}
            </span>

            <button
              onClick={() => setPage(p => p + 1)}
              disabled={!hasMore || loading}
              style={{
                ...btnStyle(true),
                opacity: !hasMore ? 0.4 : 1,
                cursor: !hasMore ? 'not-allowed' : 'pointer',
              }}
            >
              {t.next}
            </button>
          </div>
        )}

      </main>
    </>
  );
}

Market.getLayout = function getLayout(page: any) {
  return <DashBoardLayout>{page}</DashBoardLayout>;
};