import { Request, Response, NextFunction } from "express";
import Flower from "../models/Flower";
import Bid from "../models/Bid";
import User from "../models/User";
import Category from "../models/Category";
import { UserRole } from "../types/user.types";
import { FlowerStatus } from "../types/flower.types";

/**
 * Create a new Category (Admin only)
 */
export const getAllFlowers = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const flowers = await Flower.find({
      status: { $in: [FlowerStatus.LIVE, FlowerStatus.UPCOMING] },
    });
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

/**
 * User CRUD Operations
 */
export const getUsers = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const users = await User.find();
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
 * Seller CRUD Operations
 */
export const createSeller = async (req: Request, res: Response) => {
  try {
    const { username, email, password, mobile, address, image } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser)
      return res.status(400).json({ error: "Email already in use." });

    const seller = new User({
      username,
      email,
      password,
      mobile,
      role: UserRole.SELLER,
      address,
      image,
    });

    await seller.save();
    res.status(201).json({ message: "Seller created successfully.", seller });
  } catch (error) {
    console.error("Error creating seller:", error);
    res.status(500).json({ error: "Server error." });
  }
};

export const getSellers = async (req: Request, res: Response) => {
  try {
    const sellers = await User.find({ role: UserRole.SELLER });
    res.json(sellers);
  } catch (error) {
    console.error("Error fetching sellers:", error);
    res.status(500).json({ error: "Server error." });
  }
};

export const deleteSeller = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const deletedSeller = await User.findOneAndDelete({
      _id: id,
      role: UserRole.SELLER,
    });
    if (!deletedSeller)
      return res.status(404).json({ error: "Seller not found." });

    res.json({ message: "Seller deleted successfully." });
  } catch (error) {
    console.error("Error deleting seller:", error);
    res.status(500).json({ error: "Server error." });
  }
};
