import { StockApi } from "../../types/stockapi.type";

const { API_POLYGON_KEY } = process.env;

// Définition des intervalles acceptés par l'API Polygon/Twelve Data
export enum times {
  day = "day",
  week = "week",
  month = "month",
}

async function search(
  term: string,
  userId: number,
  ip: string
): Promise<StockApi[]> {
  const url = `https://api.polygon.io/v3/reference/tickers?apiKey=${API_POLYGON_KEY}&search=${term}`;
  const response = await fetch(url, {
    method: "GET",
    headers: createHeader(userId as unknown as string, ip as unknown as string),
  });
  const data = await response.json();
  const matches: StockApi[] = [];

  if (data["results"]) {
    for (let stock of data["results"]) {
      if (
        stock?.market == "stocks" || 
        stock?.market == "etfs" || 
        stock?.market == "forex" || 
        stock?.market == "crypto"
      ) {
        if (
          (stock?.currency_symbol && stock?.currency_symbol.toUpperCase() == "USD") ||
          (stock?.currency_name && stock?.currency_name?.toUpperCase() == "USD")
        ) {
          matches.push({
            symbol: stock["ticker"],
            name: stock["name"],
            market: stock["market"],
            region: stock["locale"],
            currency: stock["currency_name"],
          });
        }
      }
    }
  }

  return matches;
}

function createHeader(userId: string, ip: string) {
  return {
    "X-Polygon-Edge-ID": `${userId}`,
    "X-Polygon-Edge-IP-Address": `${ip}`,
    "X-Polygon-Edge-User-Agent": "*",
  };
}

async function getRecentPrices(
  symbol: string,
  time: times = times.day,
  userId: number,
  ip: string,
  isCrypto?: boolean
): Promise<any> {
  let today = new Date();
  let daybegining = new Date();
  daybegining.setDate(today.getDate() - 2 * 365);

  let formatedToday = today.toISOString().slice(0, 10);
  let formatedBeginingDate = daybegining.toISOString().slice(0, 10);

  const url = `https://api.polygon.io/v2/aggs/ticker/${symbol}/range/1/${time}/${formatedBeginingDate}/${formatedToday}?adjusted=true&sort=asc&limit=10000&apiKey=${API_POLYGON_KEY}`;

  const response = await fetch(url, {
    method: "GET",
    headers: createHeader(userId as unknown as string, ip as unknown as string),
  });

  return await response.json();
}

async function getDetailsStock(
  symbol: string,
  userId: number,
  ip: string
): Promise<any> {
  let url = "";
  if (symbol.startsWith("X:")) {
    url = `https://api.polygon.io/v1/summaries?ticker.any_of=${symbol}&apiKey=${API_POLYGON_KEY}`;
  } else {
    url = `https://api.polygon.io/v3/reference/tickers/${symbol}?apiKey=${API_POLYGON_KEY}`;
  }

  const response = await fetch(url, {
    method: "GET",
    headers: createHeader(userId as unknown as string, ip as unknown as string),
  });

  return await response.json();
}

async function getLogoStock(
  link: string,
  userId: number,
  ip: string
): Promise<string> {
  const url = `${link}?apiKey=${API_POLYGON_KEY}`;

  const response = await fetch(url, {
    method: "GET",
    headers: createHeader(userId as unknown as string, ip as unknown as string),
  });

  return await response.text();
}

async function getLastPrice(
  symbol: string,
  userId: number,
  ip: string
): Promise<any> {
  const url = `https://api.polygon.io/v2/aggs/ticker/${symbol}/prev?adjusted=true&apiKey=${API_POLYGON_KEY}`;

  try {
    const response = await fetch(url, {
      method: "GET",
      headers: createHeader(userId as unknown as string, ip as unknown as string),
    });

    const data = await response.json();

    if (data && data.results && data.results.length > 0) {
      return {
        results: [{
          price: data.results[0].c,
          symbol: symbol,
        }]
      };
    }
  } catch (error) {
    console.error("Erreur getLastPrice:", error);
  }

  return { results: [] };
}

const stocksService = {
  search,
  getRecentPrices,
  getDetailsStock,
  getLastPrice,
  getLogoStock,
};

export default stocksService;