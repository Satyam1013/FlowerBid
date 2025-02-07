import { Response, NextFunction } from "express";
import Bid from "../models/Bid";
import { AuthenticatedRequest } from "./authenticator";

export const bidRateLimiter = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user?._id;
    if (!userId) {
      res.status(401).json({ error: "Not authenticated" });
      return;
    }
    const lastBid = await Bid.findOne({ user: userId }).sort({ bidTime: -1 });
    if (lastBid && Date.now() - lastBid.bidTime.getTime() < 90 * 1000) {
      res
        .status(400)
        .json({ error: "You can bid only once every 90 seconds." });
      return;
    }
    next();
  } catch (err) {
    next(err);
  }
};
