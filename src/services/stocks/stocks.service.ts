import { StockApi } from "../../types/stockapi.type";

const { FINAGE_API_KEY } = process.env;

export type TimeRange = "1H" | "1D" | "1W" | "1M" | "ALL";


type AssetType = "crypto" | "forex" | "stock" | "stock_fr";

function getAssetType(symbol: string, marketHint?: string): AssetType {
  if (marketHint === "stock_fr" || marketHint === "france") return "stock_fr";

  const s = symbol.toUpperCase();
  if (s.endsWith(".PA")) return "stock_fr";

  const cryptoSuffixes = ["USD", "USDT", "BTC", "ETH"];
  const isCrypto =
    s.endsWith("USDT") ||
    (s.length > 5 && cryptoSuffixes.some((suffix) => s.endsWith(suffix))) ||
    marketHint === "crypto";
  if (isCrypto) return "crypto";

  const isForex = s.length === 6 || marketHint === "forex";
  if (isForex && marketHint !== "stock") return "forex";

  return "stock";
}


function isWithinTradingHours(): boolean {
  const now = new Date();
  const totalMin = now.getUTCHours() * 60 + now.getUTCMinutes();
  const day = now.getUTCDay();
  return day >= 1 && day <= 5 && totalMin >= 870 && totalMin < 1260;
}

function isWithinFrenchTradingHours(): boolean {
  const now = new Date();
  const totalMin = now.getUTCHours() * 60 + now.getUTCMinutes();
  const day = now.getUTCDay();
  return day >= 1 && day <= 5 && totalMin >= 420 && totalMin < 990;
}

function isForexOpenUTC(): boolean {
  const now = new Date();
  const day = now.getUTCDay();
  const hour = now.getUTCHours();
  if (day === 6) return false;
  if (day === 5 && hour >= 22) return false;
  if (day === 0 && hour < 22) return false;
  return true;
}

function getMarketStatus(type: AssetType): string {
  switch (type) {
    case "crypto":   return "open";
    case "forex":    return isForexOpenUTC() ? "open" : "closed";
    case "stock_fr": return isWithinFrenchTradingHours() ? "open" : "closed";
    default:         return isWithinTradingHours() ? "open" : "closed";
  }
}


function isDisplayable(symbol: string): boolean {
  const s = symbol.toUpperCase();
  if (s.includes("+") || s.includes("-")) return false;
  return true;
}

function formatSymbol(symbol: string, type: AssetType): string {
  switch (type) {
    case "stock_fr": return symbol.toUpperCase().replace(/\.PA$/, "");
    case "crypto":
    case "forex":    return symbol.toLowerCase();
    default:         return symbol.toUpperCase();
  }
}

function getEndpointSegment(type: AssetType): string {
  switch (type) {
    case "crypto":   return "crypto";
    case "forex":    return "forex";
    case "stock_fr": return "stock/fr";
    default:         return "stock";
  }
}


const KNOWN_CRYPTO: Record<string, string> = {
  BTCUSD:  "Bitcoin / USD",
  ETHUSD:  "Ethereum / USD",
  SOLUSD:  "Solana / USD",
  BNBUSD:  "Binance Coin / USD",
  XRPUSD:  "XRP / USD",
  ADAUSD:  "Cardano / USD",
  DOGEUSD: "Dogecoin / USD",
};

async function search(term: string, userId: number, ip: string): Promise<StockApi[]> {
  const matches: StockApi[] = [];

  try {
    const [stockRes, frRes, cryptoRes, forexRes] = await Promise.allSettled([
      fetch(`https://api.finage.co.uk/fnd/search/market/us/${encodeURIComponent(term)}?limit=10&apikey=${FINAGE_API_KEY}`),
      fetch(`https://api.finage.co.uk/fnd/search/market/fr/${encodeURIComponent(term)}?limit=10&apikey=${FINAGE_API_KEY}`),
      fetch(`https://api.finage.co.uk/fnd/search/cryptocurrency/${encodeURIComponent(term)}?limit=10&apikey=${FINAGE_API_KEY}`),
      fetch(`https://api.finage.co.uk/fnd/search/currency/${encodeURIComponent(term)}?limit=10&apikey=${FINAGE_API_KEY}`),
    ]);

    const parseResult = async (
      res: PromiseSettledResult<Response>,
      market: string,
      isFrench = false
    ) => {
      if (res.status !== "fulfilled") return;
      try {
        const d = await res.value.json();
        if (d?.results) {
          d.results.forEach((i: any) => {
            const rawSymbol: string = i.symbol || "";
            const symbol = isFrench && !rawSymbol.toUpperCase().endsWith(".PA")
              ? `${rawSymbol.toUpperCase()}.PA`
              : rawSymbol.toUpperCase();
            if (isDisplayable(symbol)) {
              matches.push({
                symbol,
                name: i.description || i.name || `${i.from} / ${i.to}`,
                market: market as any,
                region: isFrench ? "France" : "Global",
                currency: isFrench ? "EUR" : "USD",
              });
            }
          });
        }
      } catch {}
    };

    await Promise.all([
      parseResult(stockRes,  "stocks", false),
      parseResult(frRes,     "stocks", true),
      parseResult(cryptoRes, "crypto", false),
      parseResult(forexRes,  "forex",  false),
    ]);
  } catch {}

  const upperTerm = term.trim().toUpperCase();
  const alreadyFound = matches.some((m) => m.symbol.toUpperCase() === upperTerm);

  if (!alreadyFound && KNOWN_CRYPTO[upperTerm]) {
    matches.unshift({
      symbol: upperTerm,
      name: KNOWN_CRYPTO[upperTerm],
      market: "crypto" as any,
      region: "Global",
      currency: "USD",
    });
  }

  if (!alreadyFound && matches.length === 0) {
    Object.entries(KNOWN_CRYPTO).forEach(([symbol, name]) => {
      if (symbol.startsWith(upperTerm) || upperTerm.startsWith(symbol.slice(0, 3))) {
        if (!matches.some((m) => m.symbol === symbol)) {
          matches.push({ symbol, name, market: "crypto" as any, region: "Global", currency: "USD" });
        }
      }
    });
  }

  return matches;
}

async function getLastPrice(
  symbol: string,
  userId: number,
  ip: string,
  marketHint?: string
): Promise<any> {
  const type = getAssetType(symbol, marketHint);
  const segment = getEndpointSegment(type);
  const formatted = formatSymbol(symbol, type);
  const marketStatus = getMarketStatus(type);

  try {
    const r = await fetch(
      `https://api.finage.co.uk/last/${segment}/${formatted}?apikey=${FINAGE_API_KEY}`
    );
    const data = await r.json();
    const price = data.price || data.p || data.last || data.ask || data.bid;
    if (price && price > 0) {
      return { results: [{ price, symbol: symbol.toUpperCase(), market_status: marketStatus }] };
    }
  } catch {}

  if (type === "stock_fr") {
    try {
      const r = await fetch(
        `https://api.finage.co.uk/last/stock/${formatted}?apikey=${FINAGE_API_KEY}`
      );
      const data = await r.json();
      const price = data.price || data.p || data.last || data.ask || data.bid;
      if (price && price > 0) {
        return { results: [{ price, symbol: symbol.toUpperCase(), market_status: marketStatus }] };
      }
    } catch {}
  }

  return { results: [] };
}


async function fetchYahooHistory(symbol: string, range: TimeRange): Promise<any[]> {
  const intervalMap: Record<TimeRange, { interval: string; range: string }> = {
    "1H":  { interval: "5m",  range: "1d"  },
    "1D":  { interval: "15m", range: "5d"  },
    "1W":  { interval: "1h",  range: "1mo" },
    "1M":  { interval: "1d",  range: "3mo" },
    "ALL": { interval: "1wk", range: "5y"  },
  };

  const { interval, range: yahooRange } = intervalMap[range] || intervalMap["ALL"];
  const url = `https://query2.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=${interval}&range=${yahooRange}`;

  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0" },
    });
    const data = await res.json();

    const result = data?.chart?.result?.[0];
    if (!result) return [];

    const timestamps: number[] = result.timestamp || [];
    const quote = result.indicators?.quote?.[0] || {};
    const closes:  number[] = quote.close  || [];
    const opens:   number[] = quote.open   || [];
    const highs:   number[] = quote.high   || [];
    const lows:    number[] = quote.low    || [];
    const volumes: number[] = quote.volume || [];

    return timestamps
      .map((t, i) => ({
        t: t * 1000,
        o: opens[i]   ?? closes[i],
        h: highs[i]   ?? closes[i],
        l: lows[i]    ?? closes[i],
        c: closes[i],
        v: volumes[i] ?? 0,
      }))
      .filter((p) => p.c != null && !isNaN(p.c));
  } catch {
    return [];
  }
}

function buildFlatHistory(price: number, range: TimeRange): any[] {
  const now = Date.now();
  let intervalMs: number, totalPoints: number;

  switch (range) {
    case "1H": intervalMs = 60_000;           totalPoints = 60;  break;
    case "1D": intervalMs = 15 * 60_000;      totalPoints = 96;  break;
    case "1W": intervalMs = 60 * 60_000;      totalPoints = 168; break;
    case "1M": intervalMs = 8 * 60 * 60_000;  totalPoints = 90;  break;
    case "ALL":
    default:   intervalMs = 24 * 60 * 60_000; totalPoints = 365; break;
  }

  const start = now - intervalMs * totalPoints;
  const points = [];
  for (let i = 0; i <= totalPoints; i++) {
    points.push({ t: start + intervalMs * i, o: price, h: price, l: price, c: price, v: 0 });
  }
  return points;
}

async function getRecentPrices(
  symbol: string,
  range: TimeRange = "ALL",
  userId: number,
  ip: string,
  marketHint?: string
): Promise<any> {
  const type = getAssetType(symbol, marketHint);

  if (type === "stock_fr") {
    const yahooResults = await fetchYahooHistory(symbol, range);
    if (yahooResults.length > 0) {
      return { results: yahooResults };
    }

    const lastData = await getLastPrice(symbol, userId, ip, marketHint);
    const price = lastData?.results?.[0]?.price;
    if (price && price > 0) {
      return { results: buildFlatHistory(price, range) };
    }

    return { results: [] };
  }

  const now = new Date();
  const to = now.toISOString().split("T")[0];
  let from: string, timespan: string, multiplier: number;

  switch (range) {
    case "1H":
      from = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
      timespan = "minute"; multiplier = 1; break;
    case "1D":
      from = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
      timespan = "minute"; multiplier = 15; break;
    case "1W":
      from = new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
      timespan = "hour"; multiplier = 1; break;
    case "1M":
      from = new Date(now.getTime() - 35 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
      timespan = "hour"; multiplier = 8; break;
    case "ALL":
    default:
      from = "2020-01-01"; timespan = "day"; multiplier = 1;
  }

  const segment = getEndpointSegment(type);
  const formatted = formatSymbol(symbol, type);

  try {
    const url = `https://api.finage.co.uk/agg/${segment}/${formatted}/${multiplier}/${timespan}/${from}/${to}?limit=2000&sort=asc&apikey=${FINAGE_API_KEY}`;
    const res = await fetch(url);
    const data = await res.json();
    return { results: data.results || [] };
  } catch {}

  return { results: [] };
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
  getLogoStock,
};

export default stocksService;