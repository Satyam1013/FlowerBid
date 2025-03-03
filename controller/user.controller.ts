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

    return res.json({
      username: user.username,
      email: user.email,
      mobile: user.mobile,
      address: user.address,
      image: user.image,
      biddingStatus: user.biddingStatus,
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
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user?._id;
    if (!userId) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    // Find the user and ensure they have the 'user' role
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "user not found" });
    }

    if (user.role !== "user") {
      return res
        .status(403)
        .json({ error: "Only users can update their details." });
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
