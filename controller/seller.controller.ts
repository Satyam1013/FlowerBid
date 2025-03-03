import { Request, Response, NextFunction } from "express";
import Flower from "../models/Flower";
import User from "../models/User";
import { AuthenticatedRequest } from "../middleware/authenticator";

export const addFlowerBySeller = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const userId = req.user?._id;
    const seller = await User.findById(userId);

    if (!seller || seller.role !== "seller") {
      return res.status(403).json({ error: "Only sellers can add flowers." });
    }

    const {
      name,
      image,
      size,
      quantity,
      category,
      status,
      lotNumber,
      initialBidPrice,
      currentBidPrice,
      startDateTime,
      endDateTime,
    } = req.body;

    const flower = new Flower({
      name,
      image,
      size,
      quantity,
      category,
      status,
      lotNumber,
      initialBidPrice,
      currentBidPrice,
      startDateTime,
      endDateTime,
      seller: userId,
    });

    await flower.save();
    res.status(201).json({ message: "Flower added successfully.", flower });
  } catch (error) {
    console.error("Error adding flower:", error);
    res.status(500).json({ error: "Server error." });
  }
};

/**
 * Update a Flower by ID
 */
export const updateFlower = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const updatedData = req.body;

    const updatedFlower = await Flower.findByIdAndUpdate(id, updatedData, {
      new: true,
    });
    if (!updatedFlower) {
      return res.status(404).json({ error: "Flower not found." });
    }
    res.json({
      message: "Flower updated successfully.",
      flower: updatedFlower,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get a single Flower by ID
 */
export const getFlower = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const flower = await Flower.findById(id);
    if (!flower) {
      return res.status(404).json({ error: "Flower not found." });
    }
    res.json(flower);
  } catch (error) {
    next(error);
  }
};

/**
 * Get all Flowers
 */
export const getAllFlowers = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const flowers = await Flower.find({
      status: { $in: ["live", "upcoming"] },
    });
    res.json(flowers);
  } catch (error) {
    next(error);
  }
};

/**
 * Delete a Flower by ID
 */
export const deleteFlower = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const deletedFlower = await Flower.findByIdAndDelete(id);
    if (!deletedFlower) {
      return res.status(404).json({ error: "Flower not found." });
    }
    res.json({ message: "Flower deleted successfully." });
  } catch (error) {
    next(error);
  }
};


/**
 * Update a Seller by ID
 */
export const updateSeller = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const sellerId = req.user?._id;
    if (!sellerId) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    // Find the seller and ensure they have the 'seller' role
    const seller = await User.findById(sellerId);
    if (!seller) {
      return res.status(404).json({ error: "Seller not found" });
    }

    if (seller.role !== "seller") {
      return res
        .status(403)
        .json({ error: "Only sellers can update their details." });
    }

    const { username, address, image, mobile } = req.body;

    // Update seller details
    const updatedSeller = await User.findByIdAndUpdate(
      sellerId,
      { username, address, image, mobile },
      { new: true }
    );

    res.json({
      message: "Seller details updated successfully",
      seller: updatedSeller,
    });
  } catch (error) {
    next(error);
  }
};