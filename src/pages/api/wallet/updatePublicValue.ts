import { apiHandler } from "../../../helpers/api/api-handler";
import { Request } from "../../../types/request.type";
import type { NextApiResponse } from "next";
import walletsService from "../../../services/wallets/wallets.service";

export default apiHandler(updatePublicValue);

async function updatePublicValue(req: Request, res: NextApiResponse) {
  if (req.method !== "POST") throw `Method ${req.method} not allowed`;

  const { walletId, value } = req.body;
  if (!walletId || value === undefined) throw "Missing walletId or value";

  // Vérifier que le wallet appartient bien à l'utilisateur connecté
  const wallet = await walletsService.find(String(walletId));
  if (!wallet || wallet.userId !== req.auth.sub) throw "Unauthorized";

  await walletsService.updatePublicValue(walletId, value);
  return res.status(200).json({ success: true });
}