import Head from "next/head";
import Image from "next/image";
import { useEffect, useState, useCallback, useMemo } from "react";
import { useFetch } from "../../context/FetchContext.js";
import { useWallet } from "../../context/WalletContext";
import { useLanguage } from "../../context/LanguageContext";

import homeStyles from "../../styles/Home.module.css";
import marketStyles from "../../styles/Market.module.css";
import TableSearch from "../../components/TableSearch.component.jsx";
import DashBoardLayout from "../../components/layouts/DashBoard.layout";


const ITEMS_PER_PAGE = 20;

const MARKET_TO_TYPE: Record<string, string> = {
  stocks:  "us-stock",
  france:  "fr-stock",
  crypto:  "crypto",
  forex:   "forex",
};

const CRYPTO_SYMBOLS = [
  "BTC", "ETH", "USDT", "BNB", "SOL", "XRP", "USDC", "ADA", "DOGE", "AVAX", "SHIB","TAO", "DOT", "LINK", "TRX","CRO","TON","WLFI", "WBTC", "NEAR","UNI", "LTC", "DAI", "BCH", "PEPE","SUI", "ICP", "APT", "ETC", "RENDER", "STX", "FIL", "ARB","IMX", "VET", "MKR", "GRT", "LDO", "INJ", "RUNE","ASTER","SKY", "THETA","MORPHO","WLD", "FTM", "FET", "JUP", "BEAM", "CORE", "PYTH", "FLOKI", "BONK", "ONDO", "SEI", "GALA", "WIF", "PENDLE", "AR", "TIA", "HBAR", "ATOM", "W", "AAVE", "ALGO", "QNT", "FLOW", "SNX", "EGLD", "SAND", "MANA", "AXS", "EOS", "NEO", "IOTA", "XLM", "XMR", "ZEC", "DASH", "BTG", "CHZ", "HOT", "ENJ", "ZIL", "BAT", "ANKR", "RVN", "KAVA", "LRC", "KNC", "CRV", "1INCH", "SUSHI", "COMP", "DYDX", "GMX", "RPL", "SSV", "LPT", "ENS", "GLMR", "MOVR", "MINA", "ROSE", "CELO", "METIS", "STRK", "ZETA","MANTA", "ALT", "SATS", "ORDI", "BOME", "MEME", "BLUR", "XAI", "MAGIC", "GNS", "JOE", "WELL", "FLUX", "AKT", "NOS", "PRIME", "TRAC", "PAXG", "BTT", "VTHO", "BICO", "IOTX", "SCRT", "CKB", "CEL", "ONE", "WIN", "SKL", "GAL", "GMT", "APE", "ARKM", "ID", "MAV", "EDU", "HOOK", "RIF", "STG", "RDNT", "HFT", "LQTY", "GTC", "OCEAN", "AGIX", "KDA", "JASMY", "RNDR", "ENA","ZRO","DEXE","PUMP","JST","CAKE","VIRTUAL","PENGU","DASH","XTZ","SEI","DCR","KITE","GNO","CFX","KAIA","SYRUP","HNT","LUNC","AXS"
];

const CRYPTO_DATABASE = CRYPTO_SYMBOLS.map(symbol => ({
  symbol: `${symbol}USD`,
  name: symbol === "HYPE" ? "Hyperliquid" : symbol,
  market: "crypto"
}));

const POPULAR_STOCKS = [
  { symbol: "AAPL",  name: "Apple Inc.",              market: "stocks" },
  { symbol: "MSFT",  name: "Microsoft Corporation",   market: "stocks" },
  { symbol: "GOOGL", name: "Alphabet Inc.",            market: "stocks" },
  { symbol: "AMZN",  name: "Amazon.com Inc.",          market: "stocks" },
  { symbol: "NVDA",  name: "NVIDIA Corporation",       market: "stocks" },
  { symbol: "META",  name: "Meta Platforms Inc.",      market: "stocks" },
  { symbol: "TSLA",  name: "Tesla Inc.",               market: "stocks" },
  { symbol: "JPM",   name: "JPMorgan Chase & Co.",    market: "stocks" },
  { symbol: "V",     name: "Visa Inc.",                market: "stocks" },
  { symbol: "WMT",   name: "Walmart Inc.",             market: "stocks" },
  { symbol: "JNJ",   name: "Johnson & Johnson",        market: "stocks" },
  { symbol: "MA",    name: "Mastercard Inc.",          market: "stocks" },
  { symbol: "UNH",   name: "UnitedHealth Group",       market: "stocks" },
  { symbol: "XOM",   name: "Exxon Mobil Corporation",  market: "stocks" },
  { symbol: "NFLX",  name: "Netflix Inc.",             market: "stocks" },
  { symbol: "DIS",   name: "The Walt Disney Company",  market: "stocks" },
  { symbol: "PYPL",  name: "PayPal Holdings Inc.",     market: "stocks" },
  { symbol: "INTC",  name: "Intel Corporation",        market: "stocks" },
  { symbol: "AMD",   name: "Advanced Micro Devices",   market: "stocks" },
  { symbol: "BABA",  name: "Alibaba Group",            market: "stocks" },
];

const POPULAR_FRANCE = [
  { symbol: "MC.PA",    name: "LVMH",                          market: "france" },
  { symbol: "RMS.PA",   name: "Hermès International",          market: "france" },
  { symbol: "TTE.PA",   name: "TotalEnergies",                 market: "france" },
  { symbol: "OR.PA",    name: "L'Oréal",                       market: "france" },
  { symbol: "SAN.PA",   name: "Sanofi",                        market: "france" },
  { symbol: "AI.PA",    name: "Air Liquide",                   market: "france" },
  { symbol: "SU.PA",    name: "Schneider Electric",            market: "france" },
  { symbol: "AIR.PA",   name: "Airbus",                        market: "france" },
  { symbol: "BNP.PA",   name: "BNP Paribas",                   market: "france" },
  { symbol: "DSY.PA",   name: "Dassault Systèmes",             market: "france" },
  { symbol: "AM.PA",   name: "Dassault Aviation",              market: "france" },
  { symbol: "KER.PA",   name: "Kering",                        market: "france" },
  { symbol: "CS.PA",    name: "AXA",                           market: "france" },
  { symbol: "SAF.PA",   name: "Safran",                        market: "france" },
  { symbol: "DG.PA",    name: "Vinci",                         market: "france" },
  { symbol: "CAP.PA",   name: "Capgemini",                     market: "france" },
  { symbol: "RI.PA",    name: "Pernod Ricard",                 market: "france" },
  { symbol: "ACA.PA",   name: "Crédit Agricole",               market: "france" },
  { symbol: "SGO.PA",   name: "Saint-Gobain",                  market: "france" },
  { symbol: "GLE.PA",   name: "Société Générale",              market: "france" },
  { symbol: "ORA.PA",   name: "Orange",                        market: "france" },
  { symbol: "VIE.PA",   name: "Veolia",                        market: "france" },
  { symbol: "LR.PA",    name: "Legrand",                       market: "france" },
  { symbol: "EL.PA",    name: "EssilorLuxottica",              market: "france" },
  { symbol: "STM.PA",   name: "STMicroelectronics",            market: "france" },
  { symbol: "ML.PA",    name: "Michelin",                      market: "france" },
  { symbol: "PUB.PA",   name: "Publicis Groupe",               market: "france" },
  { symbol: "RNO.PA",   name: "Renault",                       market: "france" },
  { symbol: "AC.PA",    name: "Accor",                         market: "france" },
  { symbol: "ENGI.PA",  name: "Engie",                         market: "france" },
  { symbol: "HO.PA",    name: "Thales",                        market: "france" },
  { symbol: "AF.PA",    name: "Air France-KLM",                market: "france" },
  { symbol: "BN.PA",    name: "Danone",                        market: "france" },
  { symbol: "TCH.PA",   name: "Teleperformance",               market: "france" },
  { symbol: "ALO.PA",   name: "Alstom",                        market: "france" },
  { symbol: "WLN.PA",   name: "Worldline",                     market: "france" },
  { symbol: "SW.PA",    name: "Sodexo",                        market: "france" },
  { symbol: "ATO.PA",   name: "Atos",                          market: "france" },
  { symbol: "AMUN.PA",  name: "Amundi",                        market: "france" },
  { symbol: "SPIE.PA",  name: "Spie",                          market: "france" },
  { symbol: "RCO.PA",   name: "Rexel",                         market: "france" },
  { symbol: "GTT.PA",   name: "GTT",                           market: "france" },
  { symbol: "SMCP.PA",  name: "SMCP",                          market: "france" },
  { symbol: "UBI.PA",   name: "Ubisoft",                       market: "france" },
  { symbol: "COFA.PA",  name: "Coface",                        market: "france" },
  { symbol: "NXI.PA",   name: "Nexans",                        market: "france" },
  { symbol: "MERY.PA",  name: "Mersen",                        market: "france" },
  { symbol: "ERA.PA",   name: "Eramet",                        market: "france" },
  { symbol: "FNAC.PA",  name: "Fnac Darty",                    market: "france" },
  { symbol: "SFTW.PA",  name: "Soitec",                        market: "france" },
  { symbol: "TKTT.PA",  name: "Tikehau Capital",               market: "france" },
  { symbol: "VCT.PA",   name: "Vicat",                         market: "france" },
  { symbol: "VIRP.PA",  name: "Virbac",                        market: "france" },
  { symbol: "XFAB.PA",  name: "X-Fab Silicon Foundries",       market: "france" },
  { symbol: "ABCA.PA",  name: "ABC Arbitrage",                 market: "france" },
  { symbol: "VLA.PA",   name: "Vilmorin & Cie",                market: "france" },
  { symbol: "TAVI.PA",  name: "Tarkett",                       market: "france" },
  { symbol: "DBV.PA",   name: "DBV Technologies",              market: "france" },
  { symbol: "EN.PA",    name: "Bouygues",                      market: "france" },
  { symbol: "ABNX.PA",  name: "Abionyx Pharma",                market: "france" },
  { symbol: "ABVX.PA",  name: "Abivax",                        market: "france" },
  { symbol: "ADOC.PA",  name: "Adocia",                        market: "france" },
  { symbol: "AF.PA",    name: "Air France-KLM",                market: "france" },
  { symbol: "VU.PA",    name: "Vusion",                        market: "france" },
  { symbol: "BVI.PA",   name: "Bureau Veritas",                market: "france" },
  { symbol: "FGR.PA",   name: "Eiffage",                       market: "france" },  
  { symbol: "STLAP.PA", name: "Stellantis",                    market: "france" },
  { symbol: "ERF.PA",   name: "Eurofins Scientific",           market: "france" },
  { symbol: "ENX.PA",   name: "Euronext",                      market: "france" },
  { symbol: "ARAMI.PA", name: "Aramis Group SA",               market: "france" },
  { symbol: "CA.PA",    name: "Carrefour",                     market: "france" },
  { symbol: "ATE.PA",   name: "Alten",                         market: "france" },
  { symbol: "ANTIN.PA", name: "Antin Infrastructure Partners", market: "france" },
  { symbol: "ARAMI.PA", name: "Aramis Group SA",               market: "france" },
  { symbol: "ARG.PA",   name: "Argan",                         market: "france" },
  { symbol: "AKE.PA",   name: "Arkema",                        market: "france" },
  { symbol: "ASY.PA",   name: "Assystem",                      market: "france" },
  { symbol: "AB.PA",    name: "AB Science",                    market: "france" },
  { symbol: "ALATI.PA", name: "Actia Group",                   market: "france" },
  { symbol: "ADP.PA",   name: "ADP (Aéroports de Paris)",      market: "france" },
  { symbol: "AKW.PA",   name: "Akwel",                         market: "france" },
  { symbol: "CDA.PA",   name: "Compagnie des Alpes",           market: "france" },
  { symbol: "LTA.PA",   name: "Altamir",                       market: "france" },
  { symbol: "ALTA.PA",  name: "Altarea",                       market: "france" },
  { symbol: "AUB.PA",   name: "Aubay",                         market: "france" },
  { symbol: "74SW.PA",  name: "Axway Software",                market: "france" },
  { symbol: "BEN.PA",   name: "Bénéteau",                      market: "france" },
  { symbol: "BB.PA",    name: "BIC",                           market: "france" },
  { symbol: "BIG.PA",   name: "BigBen Interactive",            market: "france" },
  { symbol: "BIM.PA",   name: "bioMérieux",                    market: "france" },
  { symbol: "BOI.PA",   name: "Boiron",                        market: "france" },
  { symbol: "BOL.PA",   name: "Bolloré",                       market: "france" },
  { symbol: "BON.PA",   name: "Bonduelle",                     market: "france" },

{ symbol: "CDI.PA",   name: "Christian Dior",                 market: "france" },
{ symbol: "CLARI.PA",  name: "Clariane (ex-Korian)",           market: "france" },
{ symbol: "CRI.PA",   name: "Chargeurs",                      market: "france" },
{ symbol: "ALCGM.PA",   name: "Cegedim",                        market: "france" },
{ symbol: "VIRI.PA",   name: "CGG Viridien",                            market: "france" },
{ symbol: "DBG.PA",   name: "Derichebourg",                   market: "france" },
{ symbol: "EDEN.PA",  name: "Edenred",                        market: "france" },
{ symbol: "ELIOR.PA", name: "Elior Group",                    market: "france" },
{ symbol: "ETL.PA",   name: "Eutelsat Communications",        market: "france" },
{ symbol: "RF.PA",    name: "Eurazeo",                        market: "france" },
{ symbol: "FDJU.PA",   name: "FDJ (Française des Jeux)",       market: "france" },
{ symbol: "PEUG.PA",   name: "FFP",                            market: "france" },
{ symbol: "ODET.PA",  name: "Financière Odet",                market: "france" },
{ symbol: "COV.PA",   name: "Covivio",           market: "france" },
{ symbol: "FRVIA.PA",    name: "Forvia (ex-Faurecia)",           market: "france" },
{ symbol: "GNFT.PA",  name: "Genfit",                         market: "france" },
{ symbol: "GLO.PA",   name: "GL Events",                      market: "france" },
{ symbol: "GET.PA",   name: "Getlink (Eurotunnel)",           market: "france" },
{ symbol: "PIG.PA",   name: "Haulotte Group",                 market: "france" },
{ symbol: "ICAD.PA",  name: "Icade",                          market: "france" },
{ symbol: "IDL.PA",   name: "ID Logistics",                   market: "france" },
{ symbol: "NK.PA",    name: "Imerys",                         market: "france" },
{ symbol: "IPN.PA",   name: "Ipsen",                          market: "france" },
{ symbol: "IPS.PA",   name: "Ipsos",                          market: "france" },
{ symbol: "ITP.PA",    name: "Interparfums",                   market: "france" },
{ symbol: "DEC.PA",   name: "JCDecaux",                       market: "france" },
{ symbol: "LI.PA",    name: "Klepierre",                      market: "france" },
{ symbol: "MMB.PA",    name: "Lagardère",                      market: "france" },
{ symbol: "FII.PA",  name: "Lisi",                           market: "france" },
{ symbol: "MF.PA",    name: "Manitou BF",                     market: "france" },
{ symbol: "MAU.PA",   name: "Maurel & Prom",                  market: "france" },
{ symbol: "MERY.PA",  name: "Mercialys",                      market: "france" },
{ symbol: "NXI.PA",   name: "Nexity",                         market: "france" },
{ symbol: "NRJ.PA",   name: "NRJ Group",                      market: "france" },
{ symbol: "OPM.PA",   name: "OPmobility (ex Plastic Omnium)", market: "france" },
{ symbol: "OVH.PA",   name: "OVH Groupe",                     market: "france" },
{ symbol: "RCO.PA",   name: "Rémy Cointreau",                 market: "france" },
{ symbol: "RUI.PA",   name: "Rubis",                          market: "france" },
{ symbol: "SK.PA",    name: "SEB",                            market: "france" },
{ symbol: "SCR.PA",   name: "SCOR",                           market: "france" },
{ symbol: "SCHP.PA", name: "Séché Environnement",            market: "france" },
{ symbol: "SOP.PA",   name: "Sopra Steria",                   market: "france" },
{ symbol: "STF.PA",  name: "STEF",                           market: "france" },
{ symbol: "DIM.PA",   name: "Sartorius Stedim Biotech",       market: "france" },
{ symbol: "TRI.PA",   name: "Trigano",                        market: "france" },
{ symbol: "URW.PA",   name: "Unibail-Rodamco-Westfield",      market: "france" },
{ symbol: "FR.PA",    name: "Valeo",                          market: "france" },
{ symbol: "VIV.PA",   name: "Vivendi",                        market: "france" },
];

const POPULAR_FOREX = [
  { symbol: "EURUSD", name: "Euro / US Dollar",             market: "forex" },
  { symbol: "GBPUSD", name: "British Pound / US Dollar",    market: "forex" },
  { symbol: "USDJPY", name: "US Dollar / Japanese Yen",     market: "forex" },
  { symbol: "USDCHF", name: "US Dollar / Swiss Franc",      market: "forex" },
  { symbol: "AUDUSD", name: "Australian Dollar / USD",      market: "forex" },
  { symbol: "USDCAD", name: "US Dollar / Canadian Dollar",  market: "forex" },
  { symbol: "NZDUSD", name: "New Zealand Dollar / USD",     market: "forex" },
  { symbol: "EURGBP", name: "Euro / British Pound",         market: "forex" },
  { symbol: "EURJPY", name: "Euro / Japanese Yen",          market: "forex" },
  { symbol: "GBPJPY", name: "British Pound / Japanese Yen", market: "forex" },
];

const POPULAR_ALL = [
  ...POPULAR_STOCKS.slice(0, 6),
  ...POPULAR_FRANCE.slice(0, 4),
  ...CRYPTO_DATABASE.slice(0, 6),
  ...POPULAR_FOREX.slice(0, 4),
];

function getPopularByFilter(filter: string) {
  switch (filter) {
    case "stocks":  return POPULAR_STOCKS;
    case "france":  return POPULAR_FRANCE;
    case "crypto":  return CRYPTO_DATABASE.slice(0, ITEMS_PER_PAGE);
    case "forex":   return POPULAR_FOREX;
    default:        return POPULAR_ALL;
  }
}

export default function Market() {
  const { wallets, selectedId, selectWallet } = useWallet();
  const { lang } = useLanguage();
  const fetch = useFetch();

  const [input, setInput]                 = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [marketFilter, setMarketFilter]   = useState("all");
  const [page, setPage]                   = useState(1);
  const [apiSymbols, setApiSymbols]       = useState<any[]>([]);
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
      filterStocks:   "Actions US",
      filterFrance:   "France",
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
      portfolioLabel: "Wallet #",
      placeholder:    "Type a company name...",
      noWarrants:     "warrant",
      filterAll:      "All",
      filterStocks:   "US Stocks",
      filterFrance:   "France",
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

  const loadApiSymbols = useCallback(async (filter: string, p: number) => {
    if (filter === "crypto") {
      setHasMore(p * ITEMS_PER_PAGE < CRYPTO_DATABASE.length);
      return;
    }
    if (filter === "france") {
      setHasMore(p * ITEMS_PER_PAGE < POPULAR_FRANCE.length);
      return;
    }

    setLoading(true);
    try {
      if (filter === "all") {
        const [stocksRes, forexRes] = await Promise.allSettled([
          fetch.get(`/api/stock/symbols?type=us-stock&page=${p}&limit=10`),
          fetch.get(`/api/stock/symbols?type=forex&page=${p}&limit=10`),
        ]);
        const stocks = stocksRes.status === "fulfilled" ? (stocksRes.value?.symbols || []).slice(0, 10) : [];
        const crypto = CRYPTO_DATABASE.slice((p - 1) * 6, p * 6);
        const forex  = forexRes.status  === "fulfilled" ? (forexRes.value?.symbols  || []).slice(0, 6) : [];
        const combined = [...stocks, ...crypto, ...forex];
        setApiSymbols(combined);
        setHasMore(combined.length > 0);
      } else {
        const type = MARKET_TO_TYPE[filter] || "us-stock";
        const res  = await fetch.get(`/api/stock/symbols?type=${type}&page=${p}&limit=20`);
        const list = (res?.symbols || []).slice(0, 20);
        setApiSymbols(list);
        setHasMore(list.length > 0);
      }
    } catch (err) {
      console.error("Load symbols error:", err);
      setApiSymbols([]);
      setHasMore(false);
    } finally {
      setLoading(false);
    }
  }, [fetch]);

  useEffect(() => {
    if (!input.trim()) {
      loadApiSymbols(marketFilter, page);
    }
  }, [marketFilter, page, input, loadApiSymbols]);

  useEffect(() => {
    if (input.trim().length <= 1) {
      setSearchResults([]);
      return;
    }

    const delay = setTimeout(async () => {
      try {
        const term = input.toLowerCase().trim();
        let localMatches: any[] = [];

        if (marketFilter === "all" || marketFilter === "france") {
          const fr = POPULAR_FRANCE.filter(item => 
            item.symbol.toLowerCase().includes(term) || 
            item.name.toLowerCase().includes(term)
          );
          localMatches = [...localMatches, ...fr];
        }

        if (marketFilter === "all" || marketFilter === "crypto") {
          const crypto = CRYPTO_DATABASE.filter(item =>
            item.symbol.toLowerCase().includes(term) ||
            item.name.toLowerCase().includes(term)
          );
          localMatches = [...localMatches, ...crypto];
        }

        if (marketFilter === "all" || marketFilter === "forex") {
          const forex = POPULAR_FOREX.filter(item =>
            item.symbol.toLowerCase().includes(term) ||
            item.name.toLowerCase().includes(term)
          );
          localMatches = [...localMatches, ...forex];
        }

        const results = await fetch.get("/api/stock/search?term=" + input);
        const apiAll: any[] = results || [];

        const formattedApi = apiAll
          .filter((item: any) => {
            if (item.market === "crypto") {
              const base = item.symbol.toUpperCase().replace(/USD|USDT|EUR|GBP/, "");
              return CRYPTO_SYMBOLS.includes(base);
            }
            if (marketFilter !== "all" && item.market !== marketFilter) {
               if (marketFilter === "stocks" && item.symbol?.toUpperCase().endsWith(".PA")) return false;
               if (item.market !== marketFilter) return false;
            }
            return true;
          })
          .map((item: any) => {

            if (item.market === "crypto") {
              const base = item.symbol.toUpperCase().replace(/USD|USDT|EUR|GBP/, "");
              return { ...item, symbol: `${base}USD`, name: base === "HYPE" ? "Hyperliquid" : base };
            }
            return item;
          });

        const finalResults = [...localMatches];
        formattedApi.forEach(apiItem => {
          if (!finalResults.find(local => local.symbol.toUpperCase() === apiItem.symbol.toUpperCase())) {
            finalResults.push(apiItem);
          }
        });

        setSearchResults(finalResults);
      } catch (err) {
        console.error("Search Error:", err);
      }
    }, 600);
    return () => clearTimeout(delay);
  }, [input, fetch, marketFilter]);

  const rawList = useMemo(() => {
    if (input.trim().length > 1) return searchResults;

    if (marketFilter === "crypto") {
      const start = (page - 1) * ITEMS_PER_PAGE;
      return CRYPTO_DATABASE.slice(start, start + ITEMS_PER_PAGE);
    }

    if (marketFilter === "france") {
      const start = (page - 1) * ITEMS_PER_PAGE;
      return POPULAR_FRANCE.slice(start, start + ITEMS_PER_PAGE);
    }

    return page === 1 ? getPopularByFilter(marketFilter) : apiSymbols;
  }, [input, searchResults, marketFilter, page, apiSymbols]);

const displayList = rawList
    .filter((item: any) => {
      const nameLower = (item.name || "").toLowerCase().trim();
      if (nameLower.includes(t.noWarrants.toLowerCase())) return false;
      return true;
    })
    .map((item: any) => {
      const rawMarket = item.market || (marketFilter === "crypto" ? "crypto" : marketFilter === "france" ? "france" : "stocks");
      const displayMarket = (rawMarket === "france" || rawMarket === "stocks") ? "Action" : rawMarket;

      return {
        symbol: item.symbol,
        name:   item.name || item.description || `Action ${item.symbol}`, 
        market: displayMarket,
      };
    });

  function handleFilterChange(key: string) {
    setMarketFilter(key);
    setPage(1);
    setInput("");
    setSearchResults([]);
    setApiSymbols([]);
  }

  const onChange = (e: any) => setInput(e.target.value);
  const handleKeyDown = (e: any) => {
    if (e.key === "Escape") { setInput(""); setSearchResults([]); }
  };

  const isSearching = input.trim().length > 1;

  const filters = [
    { key: "all",    label: t.filterAll },
    { key: "stocks", label: t.filterStocks },
    { key: "france", label: t.filterFrance },
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
        <div id="tour-market-info" className={homeStyles.marketHeader} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
          <div>
            <h1 className={homeStyles.marketTitle}>{t.title}</h1>
            <p className={homeStyles.marketSub}>{t.sub}</p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div className={marketStyles.marketStatusContainer}>
              {[
                { label: t.filterStocks, info: lang === 'fr' ? '15h30 – 22h00' : '3:30 PM – 9:00 PM' },
                { label: t.filterFrance, info: lang === 'fr' ? '09h00 – 17h30' : '9:00 AM – 5:30 PM' },
                { label: t.filterForex,  info: lang === 'fr' ? 'Lun – Ven'     : 'Mon – Fri' },
                { label: t.filterCrypto, info: '24/7' },
              ].map(({ label, info }) => (
                <div key={label} className={marketStyles.marketStatusRow}>
                  <span className={marketStyles.marketStatusLabel}>{label}</span>
                  <span className={marketStyles.marketStatusBadge}>🕐 {info}</span>
                </div>
              ))}
            </div>

            <div className={homeStyles.statCard} style={{ display: 'flex', alignItems: 'center', padding: '12px 25px' }}>
              <Image src="/assets/cash.svg" width={25} height={25} alt="cash" style={{ marginRight: '12px' }} />
              <div>
                <span style={{ fontSize: '11px', color: '#888', display: 'block', textTransform: 'uppercase' }}>{t.cashLabel}</span>
                <span style={{ fontWeight: '700', fontSize: '18px' }}>{(wallets[selectedId]?.cash || 0).toLocaleString()} $</span>
              </div>
            </div>
          </div>
        </div>

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

        <div id="tour-market-categories" style={{ display: 'flex', gap: '10px', justifyContent: 'center', marginBottom: '30px', flexWrap: 'wrap' }}>
          {filters.map((f) => (
            <button key={f.key} onClick={() => handleFilterChange(f.key)} style={btnStyle(marketFilter === f.key)}>
              {f.label}
            </button>
          ))}
        </div>

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