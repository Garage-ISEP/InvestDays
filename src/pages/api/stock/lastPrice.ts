import { apiHandler } from "../../../helpers/api/api-handler";
import { NextApiResponse } from "next";
import stocksService from "../../../services/stocks/stocks.service";
import { Request } from "../../../types/request.type";
import requestIp from "request-ip";

export default apiHandler(lastPrice);

async function lastPrice(req: Request, res: NextApiResponse<any>) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: `Method ${req.method} not allowed` });
  }

  const { symbol } = req.query;
  const clientIp = requestIp.getClientIp(req);

  if (typeof symbol !== "string") {
    return res.status(400).json({ message: "Invalid symbol" });
  }

  try {
    const resp: any = await stocksService.getLastPrice(
      symbol.toUpperCase(),
      req.auth.sub,
      clientIp as string
    );

    const price = resp?.results?.[0]?.price;

    return res.status(200).json(price ? Number(price) : 0);
  } catch (error) {
    return res.status(200).json(0);
  }
}