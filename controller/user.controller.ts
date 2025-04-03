import { Request, Response, NextFunction } from "express";
import User from "../models/User";
import { AuthenticatedRequest } from "../middleware/authenticator";

export const getUserProfile = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const user = await User.findById(req.user._id)
      .select("-password")
      .populate({
        path: "biddingStatus.flower",
        model: "Flower",
        select:
          "name image category size status lotNumber description quantity",
      });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Process bids to get only the highest bid for each flower
    const highestBidsMap = new Map();

    user.biddingStatus.forEach((bid: any) => {
      const flowerId = bid.flower._id.toString();
      if (
        !highestBidsMap.has(flowerId) ||
        bid.bidAmount > highestBidsMap.get(flowerId).bidAmount
      ) {
        highestBidsMap.set(flowerId, bid);
      }
    });

    // Convert Map values to an array
    const highestBids = Array.from(highestBidsMap.values()).map((bid: any) => ({
      _id: bid._id,
      bidAmount: bid.bidAmount,
      highestBid: bid.highestBid,
      flower: bid.flower._id,
      flowerDetails: {
        name: bid.flower.name,
        image: bid.flower.image,
        category: bid.flower.category,
        status: bid.flower.status,
        lotNumber: bid.flower.lotNumber,
        description: bid.flower.description,
        quantity: bid.flower.quantity,
        size: bid.flower.size,
      },
    }));

    // Final response
    const response = {
      _id: user._id,
      name: user.username,
      email: user.email,
      mobile: user.mobile,
      address: user.address,
      image: user.image,
      balance: user.balance,
      favoriteFlowers: user.favoriteFlowers,
      biddingStatus: highestBids,
    };

    res.json(response);
  } catch (error) {
    next(error);
  }
};

export const updateUserDetails = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user?._id;
    if (!userId) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const { username, address, image, mobile } = req.body;

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { username, address, image, mobile },
      { new: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({
      message: "User details updated successfully",
      user: updatedUser,
    });
  } catch (error) {
    next(error);
  }
};
