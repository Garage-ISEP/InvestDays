import { StockApi } from "../../types/stockapi.type";

const { FINAGE_API_KEY } = process.env;

export enum times {
  day = "day",
  week = "week",
  month = "month",
}

async function search(term: string, userId: number, ip: string): Promise<StockApi[]> {
  try {
    // Lancer les 3 recherches en parallèle
    const [stockRes, cryptoRes, forexRes] = await Promise.allSettled([
      fetch(`https://api.finage.co.uk/fnd/search/market/us/${encodeURIComponent(term)}?limit=10&apikey=${FINAGE_API_KEY}`),
      fetch(`https://api.finage.co.uk/fnd/search/cryptocurrency/${encodeURIComponent(term)}?limit=5&apikey=${FINAGE_API_KEY}`),
      fetch(`https://api.finage.co.uk/fnd/search/currency/${encodeURIComponent(term)}?limit=5&apikey=${FINAGE_API_KEY}`),
    ]);

    const matches: StockApi[] = [];

    // Stocks
    if (stockRes.status === "fulfilled") {
      const data = await stockRes.value.json();
      if (data?.results && Array.isArray(data.results)) {
        data.results.forEach((stock: any) => {
          matches.push({ symbol: stock.symbol, name: stock.description, market: "stocks", region: "US", currency: "USD" });
        });
      }
    }

    // Crypto
    if (cryptoRes.status === "fulfilled") {
      const data = await cryptoRes.value.json();
      if (data?.results && Array.isArray(data.results)) {
        data.results.forEach((coin: any) => {
          matches.push({ symbol: coin.symbol, name: coin.name, market: "crypto", region: "Global", currency: "USD" });
        });
      }
    }

    // Forex
    if (forexRes.status === "fulfilled") {
      const data = await forexRes.value.json();
      if (data?.results && Array.isArray(data.results)) {
        data.results.forEach((fx: any) => {
          matches.push({ symbol: fx.symbol, name: `${fx.from} / ${fx.to}`, market: "forex", region: "Global", currency: fx.symbol?.slice(-3) || "USD" });
        });
      }
    }

    return matches;
  } catch (error) {
    console.error("Search error:", error);
    return [];
  }
}

async function getLastPrice(symbol: string, userId: number, ip: string): Promise<any> {
  const url = `https://api.finage.co.uk/last/stock/${symbol.toUpperCase()}?apikey=${FINAGE_API_KEY}`;

  try {
    const response = await fetch(url);
    const data = await response.json();

    if (data && (data.p || data.ask || data.bid)) {
      const price = data.p || ((data.ask + data.bid) / 2) || data.ask || data.bid;
      return { results: [{ price, symbol: symbol.toUpperCase() }] };
    }

    const today = new Date().toISOString().split('T')[0];
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const aggUrl = `https://api.finage.co.uk/agg/stock/${symbol.toUpperCase()}/1/day/${weekAgo}/${today}?limit=5&apikey=${FINAGE_API_KEY}`;
    
    const aggResponse = await fetch(aggUrl);
    const aggData = await aggResponse.json();
    const results = aggData?.results;

    if (Array.isArray(results) && results.length > 0) {
      const last = results[results.length - 1];
      if (last?.c) {
        return { results: [{ price: last.c, symbol: symbol.toUpperCase() }] };
      }
    }
  } catch (error) {
    return { results: [] };
  }

  return { results: [] };
}

async function getRecentPrices(symbol: string, time: times = times.day, userId: number, ip: string, _unused?: boolean): Promise<any> {
  const today = new Date().toISOString().split('T')[0];
  
  let fromDate: string;
  let multiplier: string;
  let timespan: string;

  switch (time) {
    case "week":
      fromDate = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      multiplier = "1";
      timespan = "day";
      break;
    case "month":
      fromDate = "2020-01-01";
      multiplier = "1";
      timespan = "week";
      break;
    case "day":
    default:
      fromDate = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      multiplier = "1";
      timespan = "day";
      break;
  }

  const url = `https://api.finage.co.uk/agg/stock/${symbol.toUpperCase()}/${multiplier}/${timespan}/${fromDate}/${today}?limit=500&sort=asc&apikey=${FINAGE_API_KEY}`;

  try {
    const response = await fetch(url);
    const text = await response.text();

    if (!text.startsWith('{') && !text.startsWith('[')) {
      return { results: [] };
    }

    const data = JSON.parse(text);
    return { results: data.results || [] };
  } catch (error) {
    return { results: [] };
  }
}

async function getDetailsStock(symbol: string, userId: number, ip: string): Promise<any> {
  return {
    results: {
      name: symbol.toUpperCase(), // ← c'est ça le problème, il retourne juste le symbole
      market_cap: null,
      weighted_shares_outstanding: null,
      branding: { logo_url: null },
    }
  };
}

async function getLogoStock(link: string, userId: number, ip: string): Promise<any> {
  try {
    const response = await fetch(link);
    const buffer = await response.arrayBuffer();
    return Buffer.from(buffer);
  } catch (error) {
    return "";
  }
}


async function getPreviousClose(symbol: string, userId: number, ip: string): Promise<any> {
  const today = new Date().toISOString().split('T')[0];
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  
  const url = `https://api.finage.co.uk/agg/stock/${symbol.toUpperCase()}/1/day/${weekAgo}/${today}?limit=5&sort=asc&apikey=${FINAGE_API_KEY}`;

  try {
    const response = await fetch(url);
    const text = await response.text();
    if (!text.startsWith('{') && !text.startsWith('[')) return null;

    const data = JSON.parse(text);
    const results = data?.results;

    if (Array.isArray(results) && results.length >= 2) {
      return results[results.length - 2].c;
    }
    if (Array.isArray(results) && results.length === 1) {
      return results[0].c;
    }
  } catch (error) {
    return null;
  }

  return null;
}

const stocksService = {
  search,
  getRecentPrices,
  getDetailsStock,
  getLastPrice,
  getLogoStock,
  getPreviousClose, 
};


export default stocksService;