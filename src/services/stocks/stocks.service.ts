import { StockApi } from "../../types/stockapi.type";

const { FINAGE_API_KEY } = process.env;

export type TimeRange = "1H" | "1D" | "1W" | "1M" | "ALL";


function getAssetType(symbol: string, marketHint?: string): "crypto" | "forex" | "stock" {
  const s = symbol.toUpperCase();
  const cryptoSuffixes = ["USD", "USDT", "BTC", "ETH"];
  const isCrypto = s.endsWith("USDT") || 
                   (s.length > 5 && cryptoSuffixes.some(suffix => s.endsWith(suffix))) ||
                   marketHint === "crypto";
  
  if (isCrypto) return "crypto";

  const isForex = s.length === 6 || marketHint === "forex";
  if (isForex && marketHint !== "stock") return "forex";
  return "stock";
}

function isWithinTradingHours(): boolean {
  const now = new Date();
  const utcHour = now.getUTCHours();
  const utcMin = now.getUTCMinutes();
  const totalMin = utcHour * 60 + utcMin;
  const day = now.getUTCDay();
  return day >= 1 && day <= 5 && totalMin >= 870 && totalMin < 1260;
}

function isMarketOpen(marketStatus?: string): boolean {
  if (!marketStatus) return isWithinTradingHours();
  return ["open", "extended-hours"].includes(marketStatus.toLowerCase());
}

function isDisplayable(symbol: string): boolean {
  const s = symbol.toUpperCase();
  if (s.includes('.') || s.includes('+') || s.includes('-')) return false;
  return true;
}


async function search(term: string, userId: number, ip: string): Promise<StockApi[]> {
  const matches: StockApi[] = [];
  const cleanTerm = term.trim().toUpperCase();

  try {
    const [stockRes, cryptoRes, forexRes] = await Promise.allSettled([
      fetch(`https://api.finage.co.uk/fnd/search/market/us/${encodeURIComponent(term)}?limit=10&apikey=${FINAGE_API_KEY}`),
      fetch(`https://api.finage.co.uk/fnd/search/cryptocurrency/${encodeURIComponent(term)}?limit=10&apikey=${FINAGE_API_KEY}`),
      fetch(`https://api.finage.co.uk/fnd/search/currency/${encodeURIComponent(term)}?limit=10&apikey=${FINAGE_API_KEY}`),
    ]);

    const processResults = (res: any, market: string) => {
      if (res.status === "fulfilled") {
        res.value.json().then((d: any) => {
          if (d?.results) {
            d.results.forEach((i: any) => {
              if (isDisplayable(i.symbol)) {
                matches.push({
                  symbol: i.symbol,
                  name: i.description || i.name || `${i.from} / ${i.to}`,
                  market: market as any,
                  region: "Global",
                  currency: "USD"
                });
              }
            });
          }
        }).catch(() => {});
      }
    };

    processResults(stockRes, "stocks");
    processResults(cryptoRes, "crypto");
    processResults(forexRes, "forex");

    await new Promise(resolve => setTimeout(resolve, 300));

    const alreadyFound = matches.some(m => m.symbol.toUpperCase() === cleanTerm);
    if (!alreadyFound && cleanTerm.length >= 2 && isDisplayable(cleanTerm)) {
      matches.unshift({
        symbol: cleanTerm,
        name: cleanTerm,
        market: getAssetType(cleanTerm),
        region: "Global",
        currency: "USD"
      });
    }

    return matches;
  } catch (e) {
    return matches;
  }
}

async function getLastPrice(symbol: string, userId: number, ip: string, marketHint?: string): Promise<any> {
  const type = getAssetType(symbol, marketHint);
  const endpoint = type === "crypto" ? "crypto" : type === "forex" ? "forex" : "stock";
  const formatted = (type === "stock") ? symbol.toUpperCase() : symbol.toLowerCase();

  try {
    const r = await fetch(`https://api.finage.co.uk/last/${endpoint}/${formatted}?apikey=${FINAGE_API_KEY}`);
    const data = await r.json();
    const price = data.price || data.p || data.last || data.ask || data.bid;

    if (price && price > 0) {
      return { 
        results: [{ 
          price, 
          symbol: symbol.toUpperCase(), 
          market_status: data.market_status || (isWithinTradingHours() ? "open" : "closed")
        }] 
      };
    }

    const aggData = await getRecentPrices(symbol, "1M", userId, ip, type);
    if (aggData?.results?.length > 0) {
      const last = aggData.results[aggData.results.length - 1];
      return { 
        results: [{ 
          price: last.c, 
          symbol: symbol.toUpperCase(), 
          market_status: isWithinTradingHours() ? "open" : "closed"
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

  const type = getAssetType(symbol, marketHint);
  const endpoint = type === "crypto" ? "crypto" : type === "forex" ? "forex" : "stock";
  
  try {
    const url = `https://api.finage.co.uk/agg/${endpoint}/${symbol.toUpperCase()}/${multiplier}/${timespan}/${from}/${to}?limit=2000&sort=asc&apikey=${FINAGE_API_KEY}`;
    const res = await fetch(url);
    const data = await res.json();
    return { results: data.results || [] };
  } catch (e) { return { results: [] }; }
}

async function getDetailsStock(symbol: string, userId?: string | number, ip?: string) {
  return { results: { name: symbol.toUpperCase(), branding: { logo_url: null } } };
}

async function getPreviousClose(symbol: string, userId?: number, ip?: string) {
    const res = await getLastPrice(symbol, 0, "", "");
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
  getPreviousClose, 
  getLogoStock
};

export default stocksService;