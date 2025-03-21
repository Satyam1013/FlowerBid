import { NextFunction, Request, Response } from "express";
import Flower from "../models/Flower";
import User from "../models/User";
import { FilterQuery } from "mongoose";
import mongoose from "mongoose";
import Category from "../models/Category";
import { FlowerDocument, FlowerStatus, IFlower } from "../types/flower.types";

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

    const query: FilterQuery<IFlower> = {
      status: { $in: [FlowerStatus.LIVE, FlowerStatus.UPCOMING] },
    };

    const { name, category, minPrice, maxPrice, sort } = req.query;

    if (name) {
      query.name = { $regex: new RegExp(name as string, "i") };
    }

    if (category) {
      const categories = (category as string)
        .split(",")
        .map((cat) => cat.trim());
      query.category = { $in: categories };
    }

    if (minPrice || maxPrice) {
      query.initialBidPrice = {};
      if (minPrice) query.initialBidPrice.$gte = Number(minPrice);
      if (maxPrice) query.initialBidPrice.$lte = Number(maxPrice);
    }

    const sortOptions: Record<string, 1 | -1> = {};
    if (sort) {
      sortOptions.initialBidPrice = sort === "asc" ? 1 : -1;
    }

    // Fetch all matching flowers
    const flowers = await Flower.find(query).sort(sortOptions);

    const updatedFlowers = await Promise.all(
      flowers.map(async (flower) => {
        if (currentTime >= flower.endTime) {
          // If the current time is past the endTime, set status to "closed"
          flower.status = FlowerStatus.CLOSED;
          await flower.save();
        }
        return flower;
      })
    );

    // Filter only available flowers (startTime <= currentTime < endTime)
    const availableFlowers = updatedFlowers.filter(
      (flower) =>
        flower.startTime <= currentTime && currentTime < flower.endTime
    );

    res.json(availableFlowers);
  } catch (error) {
    next(error);
  }
};

export const getLiveFlowers = async (req: Request, res: Response) => {
  try {
    const flowers = await Flower.find({
      status: FlowerStatus.LIVE,
    });
    res.json(flowers);
  } catch (error) {
    console.error("Error fetching live flowers:", error);
    res.status(500).json({ error: "Server error." });
  }
};

export const getUpcomingFlowers = async (req: Request, res: Response) => {
  try {
    // Upcoming flowers: scheduled to start in the future.
    // You can adjust conditions, e.g., startTime is in the future.
    const flowers = await Flower.find({
      status: FlowerStatus.UPCOMING,
    });
    res.json(flowers);
  } catch (error) {
    console.error("Error fetching upcoming flowers:", error);
    res.status(500).json({ error: "Server error." });
  }
};

// Place a bid for a specific flower
// export const placeBid = async (req: AuthenticatedRequest, res: Response) => {
//   try {
//     const userId = req.user?._id;
//     if (!userId) {
//       return res.status(401).json({ error: "Not authenticated" });
//     }

//     const { flowerId } = req.params;
//     const { amount } = req.body;
//     const currentTime = new Date();

//     // 1. Flower lookup
//     const flower = await Flower.findById(flowerId);
//     if (!flower) {
//       return res.status(404).json({ error: "Flower not found." });
//     }

//     // 2. Check if bidding has ended
//     if (currentTime > flower.endTime) {
//       return res
//         .status(400)
//         .json({ error: "Bidding time has ended for this flower." });
//     }

//     // 3. Ensure bid is higher than the initial bid price
//     if (amount <= flower.initialBidPrice) {
//       return res.status(400).json({
//         error: `Bid amount must be higher than the initial bid price of ₹${flower.initialBidPrice}.`,
//       });
//     }

//     // 4. Find current highest bid
//     const highestBid = await Bid.findOne({ flower: flowerId }).sort({
//       amount: -1,
//     });
//     if (highestBid && amount <= highestBid.amount) {
//       return res.status(400).json({
//         error: `Bid amount must be higher than the current highest bid of ₹${highestBid.amount}.`,
//       });
//     }

//     // 5. Prevent user from outbidding themselves
//     if (highestBid && highestBid.user.toString() === userId.toString()) {
//       return res.status(400).json({
//         error: "You cannot outbid yourself unless someone else outbids you.",
//       });
//     }

//     // 6. Create & save the new bid
//     const bid = new Bid({
//       user: userId,
//       flower: flowerId,
//       amount,
//       bidTime: currentTime,
//     });
//     const savedBid = await bid.save();

//     // 7. Determine if this bid is now the highest
//     const highestBidForFlower = await Bid.findOne({ flower: flowerId }).sort({
//       amount: -1,
//     });
//     const isHighest = highestBidForFlower
//       ? highestBidForFlower._id.equals(savedBid._id)
//       : false;

//     // 8. Prepare the bidding status entry
//     const bidStatusEntry = {
//       flowerId: String(flower._id),
//       flowerName: flower.name,
//       bidAmount: Number(amount),
//       highestBid: isHighest,
//     };

//     // 9. Update all users' biddingStatus
//     const usersWithBids = await User.find({
//       "biddingStatus.flowerId": flowerId,
//     });

//     for (const otherUser of usersWithBids) {
//       otherUser.biddingStatus = otherUser.biddingStatus.map((entry) => {
//         if (entry.flowerId === String(flower._id)) {
//           return { ...entry, highestBid: false };
//         }
//         return entry;
//       });

//       await otherUser.save();
//     }

//     // 10. Update the current user's biddingStatus
//     const user = await User.findById(userId);
//     if (user) {
//       // Add the new bid entry with highestBid = true
//       user.biddingStatus.push({ ...bidStatusEntry, highestBid: true });

//       // Keep only the latest 10 bids
//       while (user.biddingStatus.length > 10) {
//         user.biddingStatus.shift();
//       }

//       await user.save();
//     }

//     // 11. Rate limiter (Redis) set after a successful bid
//     // const redisKey = `bid:${flowerId}:${userId}`;
//     // await client?.set(redisKey, "1", { EX: 90 });

//     return res.json({ message: "Bid placed successfully.", bid: savedBid });
//   } catch (error) {
//     console.error("Error placing bid:", error);
//     res.status(500).json({ error: "Server error." });
//   }
// };

export const getFavoriteFlowers = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const userId = req.user?._id;

    const user = await User.findById(userId).populate("favoriteFlowers");
    if (!user) {
      return res.status(404).json({ error: "User not found." });
    }

    res.json({ favoriteFlowers: user.favoriteFlowers });
  } catch (error) {
    console.error("Error fetching favorite flowers:", error);
    res.status(500).json({ error: "Server error." });
  }
};

export const addFavoriteFlower = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const userId = req.user?._id;
    const { flowerId } = req.params;

    const flower = await Flower.findById(flowerId);
    if (!flower) {
      return res.status(404).json({ error: "Flower not found." });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found." });
    }
    const flowerObjectId = new mongoose.Types.ObjectId(flowerId);

    // Check if the flower is already in favorites
    if (user.favoriteFlowers.includes(flowerObjectId)) {
      return res.status(400).json({ error: "Flower is already in favorites." });
    }

    user.favoriteFlowers.push(flowerObjectId);
    await user.save();

    res.json({
      message: "Flower added to favorites.",
      favoriteFlowers: user.favoriteFlowers,
    });
  } catch (error) {
    console.error("Error adding flower to favorites:", error);
    res.status(500).json({ error: "Server error." });
  }
};

export const removeFavoriteFlower = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const userId = req.user?._id;
    const { flowerId } = req.params;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found." });
    }

    user.favoriteFlowers = user.favoriteFlowers.filter(
      (id) => id.toString() !== flowerId
    );

    await user.save();
    res.json({
      message: "Flower removed from favorites.",
      favoriteFlowers: user.favoriteFlowers,
    });
  } catch (error) {
    console.error("Error removing flower from favorites:", error);
    res.status(500).json({ error: "Server error." });
  }
};

export const getFlowersGroupedByCategory = async (
  req: Request,
  res: Response
) => {
  try {
    // Fetch all categories with their ObjectIds
    const categories = await Category.find({}, { name: 1 });

    const groupedFlowers: Record<string, FlowerDocument[] | string> = {};

    await Promise.all(
      categories.map(async (category) => {
        const flowers = await Flower.find({ category: category._id }).limit(5);

        groupedFlowers[category.name] =
          flowers.length > 0
            ? flowers
            : `No flowers found for category ${category.name}.`;
      })
    );

    res.json(groupedFlowers);
  } catch (error) {
    console.error("Error fetching flowers grouped by category:", error);
    res.status(500).json({ error: "Server error." });
  }
};
