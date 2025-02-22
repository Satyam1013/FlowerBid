import { NextFunction, Request, Response } from "express";
import Flower from "../models/Flower";
import Bid from "../models/Bid";
// import client from "../redis.client";
import User from "../models/User";

interface AuthenticatedRequest extends Request {
  user?: { _id: string };
}

export const getAvailableFlowers = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const currentTime = new Date();

    // Base query: only live or upcoming flowers with endDateTime in the future.
    const query: any = {
      status: { $in: ["live", "upcoming"] },
      endDateTime: { $gt: currentTime },
    };

    // Additional filters from query parameters:
    const { name, category, minPrice, maxPrice, sort } = req.query;

    // If 'name' is provided, search on flowerName field (case-insensitive).
    if (name) {
      query.name = { $regex: new RegExp(name as string, "i") };
    }

    // If 'category' is provided, perform a case-insensitive exact match.
    if (category) {
      query.category = { $regex: new RegExp(`^${category}$`, "i") };
    }

    // If minPrice or maxPrice is provided, filter by initialBidPrice.
    if (minPrice || maxPrice) {
      query.initialBidPrice = {};
      if (minPrice) query.initialBidPrice.$gte = Number(minPrice);
      if (maxPrice) query.initialBidPrice.$lte = Number(maxPrice);
    }

    // Build sort options based on sort query parameter.
    // For example: ?sort=asc or ?sort=desc will sort by initialBidPrice.
    const sortOptions: any = {};
    if (sort) {
      sortOptions.initialBidPrice = sort === "asc" ? 1 : -1;
    }

    const flowers = await Flower.find(query).sort(sortOptions);
    res.json(flowers);
  } catch (error) {
    next(error);
  }
};

// Get all available flowers (those whose auction hasn't ended yet)
export const getLiveFlowers = async (req: Request, res: Response) => {
  try {
    const currentTime = new Date();
    // Live flowers: the auction is currently active, and the endDateTime is in the future.
    const flowers = await Flower.find({
      status: "live",
      endDateTime: { $gt: currentTime },
    });
    res.json(flowers);
  } catch (error) {
    console.error("Error fetching live flowers:", error);
    res.status(500).json({ error: "Server error." });
  }
};

export const getUpcomingFlowers = async (req: Request, res: Response) => {
  try {
    const currentTime = new Date();
    // Upcoming flowers: scheduled to start in the future.
    // You can adjust conditions, e.g., startDateTime is in the future.
    const flowers = await Flower.find({
      status: "upcoming",
      endDateTime: { $gt: currentTime },
    });
    res.json(flowers);
  } catch (error) {
    console.error("Error fetching upcoming flowers:", error);
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
    const currentTime = new Date();

    // 1. Flower lookup
    const flower = await Flower.findById(flowerId);
    if (!flower) {
      return res.status(404).json({ error: "Flower not found." });
    }

    // 2. Check if bidding has ended
    if (currentTime > flower.endDateTime) {
      return res.status(400).json({ error: "Bidding time has ended for this flower." });
    }

    // 3. Ensure bid is higher than the initial bid price
    if (amount <= flower.initialBidPrice) {
      return res.status(400).json({
        error: `Bid amount must be higher than the initial bid price of ₹${flower.initialBidPrice}.`,
      });
    }

    // 4. Find current highest bid
    const highestBid = await Bid.findOne({ flower: flowerId }).sort({ amount: -1 });
    if (highestBid && amount <= highestBid.amount) {
      return res.status(400).json({
        error: `Bid amount must be higher than the current highest bid of ₹${highestBid.amount}.`,
      });
    }

    // 5. Prevent user from outbidding themselves
    if (highestBid && highestBid.user.toString() === userId.toString()) {
      return res.status(400).json({
        error: "You cannot outbid yourself unless someone else outbids you.",
      });
    }

    // 6. Create & save the new bid
    const bid = new Bid({
      user: userId,
      flower: flowerId,
      amount,
      bidTime: currentTime,
    });
    const savedBid = await bid.save();

    // 7. Determine if this bid is now the highest
    const highestBidForFlower = await Bid.findOne({ flower: flowerId }).sort({ amount: -1 });
    const isHighest = highestBidForFlower
      ? highestBidForFlower._id.equals(savedBid._id)
      : false;

    // 8. Prepare the bidding status entry
    const bidStatusEntry = {
      flowerId: String(flower._id),
      flowerName: flower.name,
      bidAmount: Number(amount),
      highestBid: isHighest,
    };

    // 9. Update user's biddingStatus
    const user = await User.findById(userId);
    if (user) {
      // If this is the new highest bid, set all old entries for this flower to highestBid=false
      if (isHighest) {
        user.biddingStatus = user.biddingStatus.map((entry) => {
          if (entry.flowerId === String(flower._id)) {
            return { ...entry, highestBid: false };
          }
          return entry;
        });
      }

      // Add the new bid entry
      user.biddingStatus.push(bidStatusEntry);

      // Keep only the latest 10 bids
      while (user.biddingStatus.length > 10) {
        user.biddingStatus.shift();
      }

      await user.save();
    }

    // 10. Rate limiter (Redis) set after a successful bid
    // const redisKey = `bid:${flowerId}:${userId}`;
    // await client?.set(redisKey, "1", { EX: 90 });

    return res.json({ message: "Bid placed successfully.", bid: savedBid });
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

export const addFavoriteFlower = async (req: Request, res: Response) => {
  try {
    const { flowerId } = req.params;

    const flower = await Flower.findById(flowerId);
    if (!flower) {
      return res.status(404).json({ error: "Flower not found." });
    }

    // Update the flower's isFavorite status to true
    flower.isFavorite = true;
    await flower.save();

    res.json({ message: "Flower marked as favorite.", flower });
  } catch (error) {
    console.error("Error marking flower as favorite:", error);
    res.status(500).json({ error: "Server error." });
  }
};

export const getFlowersGroupedByCategory = async (
  req: Request,
  res: Response
) => {
  try {
    const categories = [
      "Romantic",
      "Festive",
      "Elegant",
      "Exotic",
      "Traditional",
      "Modern",
    ];

    // Create an object to hold the results
    const groupedFlowers: { [key: string]: any } = {};

    await Promise.all(
      categories.map(async (category) => {
        const flowers = await Flower.find({
          category: { $regex: new RegExp(`^${category}$`, "i") },
        }).limit(5);

        // If no flowers are found, return a message; otherwise, return the array.
        groupedFlowers[category] =
          flowers.length > 0
            ? flowers
            : `No flowers found for category ${category}.`;
      })
    );

    res.json(groupedFlowers);
  } catch (error) {
    console.error("Error fetching flowers grouped by category:", error);
    res.status(500).json({ error: "Server error." });
  }
};
