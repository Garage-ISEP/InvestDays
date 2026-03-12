import { apiHandler } from "../../../helpers/api/api-handler";
import type { NextApiResponse } from "next";
import requestIp from 'request-ip';
import { Request } from "../../../types/request.type";

const { FINAGE_API_KEY } = process.env;

export default apiHandler(symbols);

async function symbols(req: Request, res: NextApiResponse<any>) {
  if (req.method !== "GET") throw `Method ${req.method} not allowed`;

  const { type = "us-stock", page = "1" } = req.query;

  const validTypes = ["us-stock", "forex", "crypto"];
  if (!validTypes.includes(type as string)) throw "Invalid type";

  const url = `https://api.finage.co.uk/symbol-list/${type}?page=${page}&apikey=${FINAGE_API_KEY}`;

  try {
    const response = await fetch(url);
    const data = await response.json();

    // Normalise le champ market selon le type
    const marketMap: Record<string, string> = {
      "us-stock": "stocks",
      "forex":    "forex",
      "crypto":   "crypto",
    };

    const normalized = (data.symbols || []).map((item: any) => ({
      symbol: item.symbol,
      name:   item.name || item.symbol,
      market: marketMap[type as string] || "stocks",
    }));

    return res.status(200).json({
      page:    data.page || 1,
      symbols: normalized,
    });
  } catch (error) {
    console.error("Symbols fetch error:", error);
    return res.status(500).json({ symbols: [], page: 1 });
  }
}