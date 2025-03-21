import { Request, Response, NextFunction } from "express";
import Flower from "../models/Flower";
import Category from "../models/Category";
import User from "../models/User";
import { AuthenticatedRequest } from "../middleware/authenticator";
import { FilterQuery } from "mongoose";
import { UserRole } from "../types/user.types";
import { FlowerDocument, FlowerStatus } from "../types/flower.types";

export const addFlowerBySeller = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const sellerId = req.user?._id;
    const seller = await User.findById(sellerId);

    if (!seller || seller.role !== UserRole.SELLER) {
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
      seller: sellerId,
      status,
      lotNumber: newLotNumber,
    });

    await flower.save();
    res.status(201).json({ message: "Flower added successfully.", flower });
  } catch (error) {
    console.error("Error adding flower:", error);
    res.status(500).json({ error: "Server error." });
  }
};

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
 * Update a Flower by ID
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

    // Find the flower by id
    const flower = await Flower.findById(id);
    if (!flower) {
      return res.status(404).json({ error: "Flower not found." });
    }

    // Check if the authenticated seller is the owner of the flower
    if (flower.seller && flower.seller.toString() !== sellerId.toString()) {
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
 * Get all Flowers by Seller ID
 */
export const getFlowersBySellerId = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const sellerId = req.user?._id;
    const flowers = await Flower.find({ seller: sellerId });
    res.json(flowers);
  } catch (error) {
    next(error);
  }
};

/**
 * Delete a Flower by ID
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
      return res.status(404).json({
        error: "Flower not found or you are not authorized to delete it.",
      });
    }

    await Flower.findByIdAndDelete(id);
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

    if (seller.role !== UserRole.SELLER) {
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
