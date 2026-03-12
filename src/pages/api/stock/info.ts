import { apiHandler } from "../../../helpers/api/api-handler";
import type { NextApiRequest, NextApiResponse } from "next";
import stocksService from "../../../services/stocks/stocks.service";
import { Request } from "../../../types/request.type";
import requestIp from 'request-ip';
//import stocksService from "../../../services/stocks/stocks.service";

// you can use the api now

export default apiHandler(info);

async function info(req: Request, res: NextApiResponse<any>) {
  if (req.method !== "GET") {
    throw `Method ${req.method} not allowed`;
  }
  const { symbol, time, market } = req.query; // On récupère l'intervalle envoyé par le front

  const clientIp = requestIp.getClientIp(req);
  if (typeof symbol != "string") throw "Invalid request";
  

  // Correction : On fait correspondre tes boutons (1d, 1w) aux termes de Twelve Data
  const timeMapping: { [key: string]: string } = {
    "1d": "day",
    "1w": "week",
    "1m": "month",
    "day": "day",
    "week": "week",
    "month": "month"
  };

  // On utilise la valeur mappée, ou "day" par défaut
  const selectedInterval = timeMapping[time as string] || "day";

  const resp = await stocksService.getRecentPrices(
    symbol.toUpperCase(),
    selectedInterval as any,
    req.auth.sub,
    clientIp as string,
    false,
    (market as string) || "stocks", 
  );

  return res.status(200).json(resp);
}