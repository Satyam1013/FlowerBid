import { Request, Response, NextFunction } from "express";
import User from "../models/User";

interface AuthenticatedRequest extends Request {
  user?: { _id: string };
}

export const getUserProfile = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const userId = req.user._id;

    // Find user by ID
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Calculate stats
    const totalAuction = user.biddingStatus?.length || 0;
    const auctionWon =
      user.biddingStatus?.filter((bs) => bs.highestBid).length || 0;
    const auctionLost = totalAuction - auctionWon;

    return res.json({
      name: user.username,
      email: user.email,
      phoneNo: user.mobile,
      address: user.address,
      image: user.image,
      totalAuction,
      auctionWon,
      auctionLost,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update the user's details.
 * Allowed fields: username, address, image, mobile (phone number).
 */
export const updateUserDetails = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const userId = authReq.user?._id;
    if (!userId) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const { username, address, image, mobile } = req.body;

    // Update the user's details
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
