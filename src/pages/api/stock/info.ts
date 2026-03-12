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
  const { symbol, time, market } = req.query; 

  const clientIp = requestIp.getClientIp(req);
  if (typeof symbol != "string") throw "Invalid request";
  

  const timeMapping: { [key: string]: string } = {
    "1d": "day",
    "1w": "week",
    "1m": "month",
    "day": "day",
    "week": "week",
    "month": "month"
  };

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