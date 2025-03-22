import { Request, Response, NextFunction } from "express";
import Flower from "../models/Flower";
import Category from "../models/Category";
import Seller from "../models/Seller";
import { AuthenticatedRequest } from "../middleware/authenticator";
import { FlowerStatus } from "../types/flower.types";
import { updateFlowerStatus } from "./update-flower";

/**
 * Add a new flower by a seller
 */
export const addFlowerBySeller = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const sellerId = req.user?._id;
    const seller = await Seller.findById(sellerId);

    if (!seller) {
      return res.status(403).json({ error: "Only sellers can add flowers." });
    }

    let {
      name,
      image,
      size,
      description,
      quantity,
      category,
      initialBidPrice,
      startTime,
      endTime,
    } = req.body;

    // Find category by name
    const existingCategory = await Category.findOne({ name: category });
    if (!existingCategory) {
      return res.status(400).json({ error: "Invalid category name." });
    }

    const now = new Date();
    const startDate = new Date(startTime);
    const endDate = new Date(endTime);

    let status = FlowerStatus.UPCOMING;
    if (now >= startDate && now < endDate) {
      status = FlowerStatus.LIVE;
    } else if (now >= endDate) {
      status = FlowerStatus.CLOSED;
    }

    // Generate lotNumber automatically
    const lastFlower = await Flower.findOne().sort({ lotNumber: -1 });
    const newLotNumber = lastFlower ? lastFlower.lotNumber + 1 : 1;

    const flower = new Flower({
      name,
      image,
      size,
      quantity,
      description,
      category: existingCategory.name,
      initialBidPrice,
      currentBidPrice: initialBidPrice,
      startTime,
      endTime,
      status,
      lotNumber: newLotNumber,
      seller: sellerId,
    });

    await flower.save();
    res.status(201).json({ message: "Flower added successfully.", flower });
  } catch (error) {
    console.error("Error adding flower:", error);
    res.status(500).json({ error: "Server error." });
  }
};

/**
 * Fetch all categories
 */
export const getCategories = async (req: Request, res: Response) => {
  try {
    const categories = await Category.find();
    res.status(200).json(categories);
  } catch (error) {
    console.error("Error fetching categories:", error);
    res.status(500).json({ error: "Server error" });
  }
};

/**
 * Update a flower by ID (only by the seller who owns it)
 */
export const updateFlower = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const sellerId = req.user?._id;

    if (!sellerId) {
      return res.status(401).json({ error: "Not authenticated." });
    }

    // Find the flower
    const flower = await Flower.findById(id);
    if (!flower) {
      return res.status(404).json({ error: "Flower not found." });
    }

    // Check if the seller owns the flower
    if (!flower.seller || flower.seller.toString() !== sellerId.toString()) {
      return res
        .status(403)
        .json({ error: "Not authorized to update this flower." });
    }

    // Update the flower with the provided data
    const updatedFlower = await Flower.findByIdAndUpdate(id, req.body, {
      new: true,
    });

    res.json({
      message: "Flower updated successfully.",
      flower: updatedFlower,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all flowers added by a seller
 */
export const getFlowersBySellerId = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    await updateFlowerStatus();

    const sellerId = req.user?._id;
    const flowers = await Flower.find({ seller: sellerId });
    res.json(flowers);
  } catch (error) {
    next(error);
  }
};

/**
 * Delete a flower by ID (only by the seller who owns it)
 */
export const deleteFlower = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const sellerId = req.user?._id;

    if (!sellerId) {
      return res.status(401).json({ error: "Not authenticated." });
    }

    const flower = await Flower.findOne({ _id: id, seller: sellerId });

    if (!flower) {
      return res
        .status(404)
        .json({ error: "Flower not found or unauthorized." });
    }

    await Flower.findByIdAndDelete(id);
    res.json({ message: "Flower deleted successfully." });
  } catch (error) {
    next(error);
  }
};

/**
 * Update seller details
 */
export const updateSeller = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const sellerId = req.user?._id;
    if (!sellerId) {
      return res.status(401).json({ error: "Not authenticated." });
    }

    // Find the seller in the separate Seller collection
    const seller = await Seller.findById(sellerId);
    if (!seller) {
      return res.status(404).json({ error: "Seller not found" });
    }

    const { username, address, image, mobile } = req.body;

    // Update seller details
    const updatedSeller = await Seller.findByIdAndUpdate(
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
