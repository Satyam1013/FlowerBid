import { Request, Response } from "express";
import Flower from "../models/Flower";
import Bid from "../models/Bid";

interface AuthenticatedRequest extends Request {
  user?: { _id: string };
}

export const getAvailableFlowers = async (
  req: Request,
  res: Response
)  => {
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
 * (Note: Rate limiting is enforced separately by middleware.)
 */
export const placeBid = async (req: Request, res: Response)  => {
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

export const favoriteFlowers = async (
  req: Request,
  res: Response
)  => {
  try {
    const favorites = await Flower.find({ isFavorite: true });
    res.json(favorites);
  } catch (error) {
    console.error("Error fetching favorite flowers:", error);
    res.status(500).json({ error: "Server error." });
  }
};
