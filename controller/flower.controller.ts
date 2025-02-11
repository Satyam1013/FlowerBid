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

export const placeBid = async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const userId = authReq.user?._id;
    if (!userId) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const { flowerId } = req.params;
    const { amount } = req.body;

    // Find the flower
    const flower = await Flower.findById(flowerId);
    if (!flower) {
      return res.status(404).json({ error: "Flower not found." });
    }

    // Check if bidding time has ended
    if (new Date() > flower.bidEndTime) {
      return res.status(400).json({ error: "Bidding time has ended for this flower." });
    }

    // Find the last bid for this flower
    const lastBid = await Bid.findOne({ flower: flowerId }).sort({ bidTime: -1 });

    // Check if the user has already bid on this flower within 90 seconds
    const recentUserBid = await Bid.findOne({ flower: flowerId, user: userId })
      .sort({ bidTime: -1 });

    if (recentUserBid) {
      const timeDiff = (new Date().getTime() - recentUserBid.bidTime.getTime()) / 1000;
      if (timeDiff < 90) {
        return res.status(400).json({ error: `You must wait ${90 - Math.floor(timeDiff)} seconds before bidding again.` });
      }
    }

    // If the last bid was made by the same user and no one has outbid them, deny bid
    if (lastBid && lastBid.user.toString() === userId.toString() && lastBid.amount >= amount) {
      return res.status(400).json({ error: "You cannot increase your bid unless another user has outbid you." });
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
