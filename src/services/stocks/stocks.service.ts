import { StockApi } from "../../types/stockapi.type";

const { FINAGE_API_KEY } = process.env;

export enum times {
  day = "day",
  week = "week",
  month = "month",
}


function getAssetType(symbol: string): "crypto" | "forex" | "stock" {
  const s = symbol.toUpperCase();

  if (s.endsWith("BTC") || s.endsWith("ETH") || s.endsWith("USDT") || s.endsWith("USDC") || s.endsWith("BNB") || s.endsWith("SOL")) {
    return "crypto";
  }

  const KNOWN_FOREX = [
    "EURUSD","GBPUSD","USDJPY","USDCHF","AUDUSD","USDCAD",
    "NZDUSD","EURGBP","EURJPY","GBPJPY","USDCNY","USDTRY",
    "USDSEK","USDNOK","USDDKK"
  ];
  if (KNOWN_FOREX.includes(s)) return "forex";

  if (s.length > 6) return "crypto";

  if (s.length === 6) {
    const currencies = ["USD","EUR","GBP","JPY","CHF","CAD","AUD","NZD","TRY","ZAR","SGD"];
    const prefix = currencies.includes(s.slice(0, 3));
    const suffix = currencies.includes(s.slice(3, 6));

    if (suffix && !prefix) return "crypto";
    if (suffix && prefix) return "forex";
  }


  return "stock";
}

async function search(term: string, userId: number, ip: string): Promise<StockApi[]> {
  try {
    const [stockRes, cryptoRes, forexRes] = await Promise.allSettled([
      fetch(`https://api.finage.co.uk/fnd/search/market/us/${encodeURIComponent(term)}?limit=10&apikey=${FINAGE_API_KEY}`),
      fetch(`https://api.finage.co.uk/fnd/search/cryptocurrency/${encodeURIComponent(term)}?limit=5&apikey=${FINAGE_API_KEY}`),
      fetch(`https://api.finage.co.uk/fnd/search/currency/${encodeURIComponent(term)}?limit=5&apikey=${FINAGE_API_KEY}`),
    ]);

    const matches: StockApi[] = [];
    
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
      if (d?.results) d.results.forEach((i: any) => matches.push({ symbol: i.symbol, name: `${i.from} / ${i.to}`, market: "forex", region: "Global", currency: i.symbol?.slice(-3) || "USD" }));
    }
    return matches;
  } catch (e) { return []; }
}

async function getLastPrice(symbol: string, userId: number, ip: string): Promise<any> {
  const type = getAssetType(symbol);

  const attemptOrder: ("crypto" | "stock" | "forex")[] = [type, "crypto", "stock"];

  for (const t of Array.from(new Set(attemptOrder))) {
    const endpoint = t === "crypto" ? "crypto" : t === "forex" ? "forex" : "stock";
    try {
      const url = `https://api.finage.co.uk/last/${endpoint}/${symbol.toLowerCase()}?apikey=${FINAGE_API_KEY}`;
      const response = await fetch(url);
      const data = await response.json();
      
      let price = data.price || data.p || data.ask || data.bid || ((data.ask + data.bid) / 2);

      if (!price || price === 0) {
        const today = new Date().toISOString().split('T')[0];
        const start = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        const aggUrl = `https://api.finage.co.uk/agg/${endpoint}/${symbol.toUpperCase()}/1/day/${start}/${today}?limit=5&apikey=${FINAGE_API_KEY}`;
        const aggRes = await fetch(aggUrl);
        const aggData = await aggRes.json();
        if (aggData.results?.length > 0) {
          price = aggData.results[aggData.results.length - 1].c;
        }
      }

      if (price && price > 0) {
        return { results: [{ price, symbol: symbol.toUpperCase() }] };
      }
    } catch (e) {}
  }
  return { results: [] };
}

async function getRecentPrices(
  symbol: string,
  time: times = times.day,
  userId: number,
  ip: string,
  _un?: boolean,
  marketHint?: string
): Promise<any> {
  const today = new Date().toISOString().split('T')[0];

  const fromDate = time === "month" ? "2022-01-01" : new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const timespan = time === "month" ? "week" : "day";

  const primary = marketHint === "stocks" ? "stock" : (marketHint || getAssetType(symbol));
  const attemptOrder = primary === "crypto" ? ["crypto", "stock"] : [primary, "stock", "crypto"];

  for (const type of Array.from(new Set(attemptOrder))) {
    const endpoint = type === "crypto" ? "crypto" : type === "forex" ? "forex" : "stock" as any;
    const url = `https://api.finage.co.uk/agg/${endpoint}/${symbol.toUpperCase()}/1/${timespan}/${fromDate}/${today}?limit=500&sort=asc&apikey=${FINAGE_API_KEY}`;

    try {
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.results && data.results.length > 0) {
        console.log(`[FINAGE] Found chart for ${symbol} in category: ${endpoint}`);
        return { results: data.results };
      }
    } catch (e) {}
  }

  return { results: [] };
}


async function getDetailsStock(symbol: string, userId?: number, ip?: string) {
  return { results: { name: symbol.toUpperCase(), branding: { logo_url: null } } };
}

async function getPreviousClose(symbol: string) {
    const res = await getLastPrice(symbol, 0, "");
    return res.results?.[0]?.price || null;
}

const stocksService = { 
  search, 
  getRecentPrices, 
  getDetailsStock, 
  getLastPrice, 
  getLogoStock: async (url?: string, userId?: number, ip?: string) => "", 
  getPreviousClose 
};

export default stocksService;