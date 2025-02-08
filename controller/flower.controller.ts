import { Request, Response } from "express";
import Flower from "../models/Flower";
import Bid from "../models/Bid";

interface AuthenticatedRequest extends Request {
  user?: { _id: string };
}

export const getAvailableFlowers = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const currentTime = new Date();
    const flowers = await Flower.find({ bidEndTime: { $gt: currentTime } });
    res.json(flowers);
  } catch (error) {
    console.error("Error fetching flowers:", error);
    res.status(500).json({ error: "Server error." });
  }
};

/**
 * Place a bid for a specific flower.
 * Enforces that a user can only bid once for a flower every 90 seconds.
 */
export const placeBid = async (req: Request, res: Response): Promise<void> => {
  try {
    // Type-cast req to AuthenticatedRequest to access req.user
    const authReq = req as AuthenticatedRequest;
    const userId = authReq.user?._id;
    if (!userId) {
      res.status(401).json({ error: "Not authenticated" });
      return;
    }

    const { flowerId } = req.params;
    const { amount } = req.body;

    // Find the specified flower
    const flower = await Flower.findById(flowerId);
    if (!flower) {
      res.status(404).json({ error: "Flower not found." });
      return;
    }

    // Check if bidding time has ended for this flower
    if (new Date() > flower.bidEndTime) {
      res
        .status(400)
        .json({ error: "Bidding time has ended for this flower." });
      return;
    }

    // Enforce a 90-second bid rate limit per user for this flower.
    const ninetySecondsAgo = new Date(Date.now() - 90 * 1000);
    const recentBid = await Bid.findOne({
      user: userId,
      flower: flowerId,
      bidTime: { $gt: ninetySecondsAgo },
    });
    if (recentBid) {
      res.status(400).json({
        error: "You can only bid once every 90 seconds for this flower.",
      });
      return;
    }

    // Create and save the bid
    const bid = new Bid({
      user: userId,
      flower: flowerId,
      amount,
      bidTime: new Date(),
    });
    await bid.save();

    res.json({ message: "Bid placed successfully.", bid });
  } catch (error) {
    console.error("Error placing bid:", error);
    res.status(500).json({ error: "Server error." });
  }
};
