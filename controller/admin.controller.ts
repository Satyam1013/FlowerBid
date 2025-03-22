import { Request, Response, NextFunction } from "express";
import Flower from "../models/Flower";
import Bid from "../models/Bid";
import User from "../models/User";
import Category from "../models/Category";
import { UserRole } from "../types/user.types";
import { FlowerStatus } from "../types/flower.types";
import Seller from "../models/Seller";
import bcrypt from "bcrypt";

/**
 * Create a new Category (Admin only)
 */
export const getAllFlowers = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const flowers = await Flower.find();
    res.json(flowers);
  } catch (error) {
    next(error);
  }
};

export const createCategory = async (req: Request, res: Response) => {
  try {
    const { name } = req.body;
    if (!name)
      return res.status(400).json({ error: "Category name is required." });

    const existingCategory = await Category.findOne({ name });
    if (existingCategory)
      return res.status(400).json({ error: "Category already exists." });

    const category = new Category({ name });
    await category.save();

    res
      .status(201)
      .json({ message: "Category created successfully.", category });
  } catch (error) {
    console.error("Error creating category:", error);
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
 * User CRUD Operations
 */
export const getUsers = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const users = await User.find({ role: UserRole.USER });
    res.json(users);
  } catch (error) {
    next(error);
  }
};

export const deleteUser = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const deletedUser = await User.findOneAndDelete({
      _id: id,
      role: UserRole.USER,
    });
    if (!deletedUser) {
      return res.status(404).json({ error: "User not found." });
    }
    res.json({ message: "User deleted successfully." });
  } catch (error) {
    next(error);
  }
};

/**
 * Create a new seller account
 */
export const createSeller = async (req: Request, res: Response) => {
  try {
    const { username, email, password, mobile } = req.body;

    // Check if email already exists
    const existingSeller = await Seller.findOne({ email });
    if (existingSeller) {
      return res.status(400).json({ error: "Email already in use." });
    }

    // Check if mobile number already exists
    const existingMobile = await Seller.findOne({ mobile });
    if (existingMobile) {
      return res.status(400).json({ error: "Mobile number already in use." });
    }

    const newSeller = new Seller({
      username,
      email,
      password: await bcrypt.hash(password, 10),
      mobile,
      role: UserRole.SELLER,
    });

    await newSeller.save();
    res
      .status(201)
      .json({ message: "Seller created successfully.", seller: newSeller });
  } catch (error: any) {
    console.error("Error creating seller:", error);

    // Handle duplicate key error from MongoDB
    if (error.code === 11000) {
      const duplicateKey = Object.keys(error.keyPattern)[0]; // Get the field causing the error
      return res.status(400).json({ error: `${duplicateKey} already in use.` });
    }

    res.status(500).json({ error: "Internal Server Error" });
  }
};

/**
 * Fetch all sellers
 */
export const getSellers = async (req: Request, res: Response) => {
  try {
    const sellers = await Seller.find();
    res.json(sellers);
  } catch (error) {
    console.error("Error fetching sellers:", error);
    res.status(500).json({ error: "Server error." });
  }
};

/**
 * Delete a seller by ID
 */
export const deleteSeller = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const deletedSeller = await Seller.findByIdAndDelete(id);

    if (!deletedSeller) {
      return res.status(404).json({ error: "Seller not found." });
    }

    res.json({ message: "Seller deleted successfully." });
  } catch (error) {
    console.error("Error deleting seller:", error);
    res.status(500).json({ error: "Server error." });
  }
};

/**
 * Manually Determine the Winner for a Flower
 **/
export const determineWinner = async (req: Request, res: Response) => {
  try {
    const { flowerId } = req.params;

    // Find the flower
    const flower = await Flower.findById(flowerId);
    if (!flower) {
      return res.status(404).json({ error: "Flower not found." });
    }

    // Check if the bidding time has ended
    const currentTime = new Date();
    if (flower.status === FlowerStatus.LIVE && currentTime < flower.endTime) {
      return res.status(400).json({ error: "Bidding is still ongoing." });
    }

    // Find the highest bid for this flower
    const highestBid = await Bid.findOne({ flower: flowerId })
      .sort({ amount: -1 })
      .populate("user", "name email");

    if (!highestBid) {
      return res
        .status(200)
        .json({ message: "No bids were placed for this flower." });
    }

    // Update the flower document with the winning bid and update status
    flower.winningBid = highestBid._id;
    flower.status = FlowerStatus.CLOSED;
    await flower.save();

    return res.json({
      message: "Winner determined successfully!",
      flowerId,
      winner: {
        user: highestBid.user,
        amount: highestBid.amount,
        bidTime: highestBid.bidTime,
      },
    });
  } catch (error) {
    console.error("Error determining bid winner:", error);
    res.status(500).json({ error: "Server error." });
  }
};
