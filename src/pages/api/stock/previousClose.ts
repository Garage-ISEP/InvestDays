import { apiHandler } from "../../../helpers/api/api-handler";
import { NextApiResponse } from "next";
import stocksService from "../../../services/stocks/stocks.service";
import { Request } from "../../../types/request.type";
import requestIp from "request-ip";

export default apiHandler(previousClose);

async function previousClose(req: Request, res: NextApiResponse<any>) {
  if (req.method !== "GET") return res.status(405).json({ message: "Method not allowed" });

  const { symbol } = req.query;
  const clientIp = requestIp.getClientIp(req);

  if (typeof symbol !== "string") return res.status(400).json({ message: "Invalid symbol" });

  const price = await stocksService.getPreviousClose(symbol.toUpperCase(), req.auth.sub, clientIp as string);
  
  return res.status(200).json(price ?? 0);
}