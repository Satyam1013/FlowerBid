import { Request, Response, NextFunction } from "express";
import Flower from "../models/Flower";
import Bid from "../models/Bid";

interface AuthenticatedRequest extends Request {
  user?: { _id: string };
}

// Get all available flowers (those whose auction hasn't ended yet)
export const getAvailableFlowers = async (req: Request, res: Response) => {
  try {
    const currentTime = new Date();
    // Use endDateTime to filter flowers that are still open for bidding.
    const flowers = await Flower.find({ endDateTime: { $gt: currentTime } });
    res.json(flowers);
  } catch (error) {
    console.error("Error fetching flowers:", error);
    res.status(500).json({ error: "Server error." });
  }
};

// Place a bid for a specific flower
export const placeBid = async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const userId = authReq.user?._id;
    if (!userId) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const { flowerId } = req.params;
    const { amount } = req.body;

    // Find the specified flower
    const flower = await Flower.findById(flowerId);
    if (!flower) {
      return res.status(404).json({ error: "Flower not found." });
    }

    // Check if bidding time has ended using the new endDateTime field
    if (new Date() > flower.endDateTime) {
      return res
        .status(400)
        .json({ error: "Bidding time has ended for this flower." });
    }

    // Ensure that the bid amount is higher than the initial bid price
    if (amount <= flower.initialBidPrice) {
      return res
        .status(400)
        .json({
          error: `Bid amount must be higher than the initial bid price of ₹${flower.initialBidPrice}.`,
        });
    }

    // Find the current highest bid for this flower (if any)
    const highestBid = await Bid.findOne({ flower: flowerId }).sort({
      amount: -1,
    });
    if (highestBid && amount <= highestBid.amount) {
      return res
        .status(400)
        .json({
          error: `Bid amount must be higher than the current highest bid of ₹${highestBid.amount}.`,
        });
    }

    // Check if the user has already bid on this flower within 90 seconds
    const recentUserBid = await Bid.findOne({
      flower: flowerId,
      user: userId,
    }).sort({ bidTime: -1 });
    if (recentUserBid) {
      const timeDiff =
        (new Date().getTime() - recentUserBid.bidTime.getTime()) / 1000;
      if (timeDiff < 90) {
        return res
          .status(400)
          .json({
            error: `You must wait ${
              90 - Math.floor(timeDiff)
            } seconds before bidding again.`,
          });
      }
    }

    // Create and save the new bid
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

// Get all favorite flowers
export const favoriteFlowers = async (req: Request, res: Response) => {
  try {
    const favorites = await Flower.find({ isFavorite: true });
    res.json(favorites);
  } catch (error) {
    console.error("Error fetching favorite flowers:", error);
    res.status(500).json({ error: "Server error." });
  }
};
