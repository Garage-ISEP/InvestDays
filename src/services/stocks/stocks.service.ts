import { StockApi } from "../../types/stockapi.type";

const { FINAGE_API_KEY } = process.env;

export type TimeRange = "1H" | "1D" | "1W" | "1M" | "ALL";

function getAssetType(symbol: string): "crypto" | "forex" | "stock" {
  const s = symbol.toUpperCase();
  const isForex = s.length === 6 && !s.endsWith("USDT") && !s.includes("BTC") && !s.includes("ETH");
  
  const KNOWN_FOREX = ["EURUSD","GBPUSD","USDJPY","USDCHF","AUDUSD","USDCAD","NZDUSD","EURGBP","EURJPY","GBPJPY", "EURDOP"];
  
  if (KNOWN_FOREX.includes(s) || isForex) {
    return "forex";
  }

  if (s.endsWith("USDT") || s.endsWith("BTC") || s.endsWith("ETH") || s.length > 6) {
    return "crypto";
  }

  return "stock";
}

async function fetchWithFallback(endpoint: string, symbol: string, fetcher: (s: string, ts?: string, mult?: number) => Promise<any>, ts: string, mult: number) {
  const syms = [symbol.toUpperCase(), symbol.toUpperCase() + "USD", symbol.toUpperCase() + "USDT"];
  for (const s of syms) {
    let data = await fetcher(s, ts, mult);
    if (data?.results?.length > 0 || data?.price || data?.p) return data;
    if (ts !== "day") {
        data = await fetcher(s, "day", 1);
        if (data?.results?.length > 0) return data;
    }
  }
  return { results: [] };
}

async function search(term: string, userId: number, ip: string): Promise<StockApi[]> {
  const matches: StockApi[] = [];
  const cleanTerm = term.trim().toUpperCase();

  try {
    const [stockRes, cryptoRes, forexRes] = await Promise.allSettled([
      fetch(`https://api.finage.co.uk/fnd/search/market/us/${encodeURIComponent(term)}?limit=10&apikey=${FINAGE_API_KEY}`),
      fetch(`https://api.finage.co.uk/fnd/search/cryptocurrency/${encodeURIComponent(term)}?limit=5&apikey=${FINAGE_API_KEY}`),
      fetch(`https://api.finage.co.uk/fnd/search/currency/${encodeURIComponent(term)}?limit=5&apikey=${FINAGE_API_KEY}`),
    ]);

    if (stockRes.status === "fulfilled") {
      const d = await stockRes.value.json();
      if (d?.results) d.results.forEach((i: any) => matches.push({ symbol: i.symbol, name: i.description, market: "stocks", region: "US", currency: "USD" }));
    }
    if (cryptoRes.status === "fulfilled") {
      const d = await cryptoRes.value.json();
      if (d?.results) d.results.forEach((i: any) => matches.push({ symbol: i.symbol, name: i.name, market: "crypto", region: "Global", currency: "USD" }));
    }
    if (forexRes.status === "fulfilled") {
      const d = await forexRes.value.json();
      if (d?.results) d.results.forEach((i: any) => matches.push({ symbol: i.symbol, name: `${i.from} / ${i.to}`, market: "forex", region: "Global", currency: "USD" }));
    }

    const alreadyFound = matches.some(m => m.symbol.toUpperCase() === cleanTerm);
    
    if (!alreadyFound && cleanTerm.length >= 2 && !cleanTerm.includes(" ")) {
      const directPrice = await getLastPrice(cleanTerm, userId, ip);
      if (directPrice?.results?.length > 0) {
        matches.unshift({
          symbol: cleanTerm,
          name: cleanTerm,
          market: getAssetType(cleanTerm),
          region: "Global",
          currency: "USD"
        });
      }
    }

    return matches;
  } catch (e) { 
    return matches; 
  }
}

async function getLastPrice(symbol: string, userId: number, ip: string, marketHint?: string): Promise<any> {
  const type = marketHint || getAssetType(symbol);
  const endpoint = type === "crypto" ? "crypto" : type === "forex" ? "forex" : "stock";
  
  const fetcher = async (s: string) => {
    const r = await fetch(`https://api.finage.co.uk/last/${endpoint}/${s.toLowerCase()}?apikey=${FINAGE_API_KEY}`);
    return await r.json();
  };
  
  try {
    const data = await fetchWithFallback(endpoint, symbol, fetcher, "day", 1);
    const price = data.price || data.p || data.ask || data.bid;
    const status = data.market_status || "open"
    if (price) return { results: [{ price, symbol: symbol.toUpperCase(), market_status: status }] };
  } catch (e) {}

  try {
    const aggData = await getRecentPrices(symbol, "1D", userId, ip, type);
    if (aggData?.results && aggData.results.length > 0) {
      const lastCandle = aggData.results[aggData.results.length - 1]
      return { 
        results:[{ 
          price: lastCandle.c, 
          symbol: symbol.toUpperCase(), 
          market_status: "open" 
        }] 
      };
    }
  } catch (e) {}

  return { results: [] };
}


async function getRecentPrices(symbol: string, range: TimeRange = "1M", userId: number, ip: string, marketHint?: string): Promise<any> {
  const now = new Date();
  const to = now.toISOString().split('T')[0];
  let from: string, timespan: string, multiplier: number;

  switch (range) {
    case "1H": from = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]; timespan = "minute"; multiplier = 1; break;
    case "1D": from = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]; timespan = "minute"; multiplier = 15; break;
    case "1W": from = new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]; timespan = "hour"; multiplier = 1; break;
    case "1M": from = new Date(now.getTime() - 35 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]; timespan = "hour"; multiplier = 8; break;
    case "ALL": default: from = "2020-01-01"; timespan = "day"; multiplier = 1;
  }

  const primary = marketHint === "crypto" ? "crypto" : (marketHint || getAssetType(symbol));
  const endpoint = primary === "crypto" ? "crypto" : primary === "forex" ? "forex" : "stock";
  
  const fetcher = async (s: string, tspan?: string, mult?: number) => {
    const url = `https://api.finage.co.uk/agg/${endpoint}/${s.toUpperCase()}/${mult || multiplier}/${tspan || timespan}/${from}/${to}?limit=2000&sort=asc&apikey=${FINAGE_API_KEY}`;
    const res = await fetch(url);
    return await res.json();
  };

  try {
    const data = await fetchWithFallback(endpoint, symbol, fetcher, timespan, multiplier);
    return { results: data.results || [] };
  } catch (e) { return { results: [] }; }
}

async function getDetailsStock(symbol: string, userId?: string | number, ip?: string) {
  return { results: { name: symbol.toUpperCase(), branding: { logo_url: null } } };
}

async function getPreviousClose(symbol: string, userId?: number, ip?: string) {
    const res = await getLastPrice(symbol, 0, "");
    return res.results?.[0]?.price || null;
}

async function getLogoStock(url?: string, userId?: string | number, ip?: string) {
  return "";
}

const stocksService = { 
  search, 
  getRecentPrices, 
  getLastPrice, 
  getDetailsStock, 
  getLogoStock,
  getPreviousClose
};
export default stocksService;