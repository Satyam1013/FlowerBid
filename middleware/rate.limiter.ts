import { Request, Response, NextFunction } from "express";
import client from "../redis.client";

// Here we assume that req.user is already populated by your authenticator.
interface AuthenticatedRequest extends Request {
  user?: { _id: string };
}

export const bidRateLimiter = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user?._id;
    const flowerId = req.params.flowerId;
    if (!userId) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    // Create a unique key for this user and flower
    const redisKey = `bid:${flowerId}:${userId}`;

    // Check if this key exists in Redis
    const exists = await client.get(redisKey);
    if (exists) {
      return res.status(400).json({
        error: "You can bid only once every 90 seconds for this flower.",
      });
    }

    // Set the key with an expiration of 90 seconds
    await client.set(redisKey, "1", { EX: 90 });
    next();
  } catch (err) {
    next(err);
  }
};
