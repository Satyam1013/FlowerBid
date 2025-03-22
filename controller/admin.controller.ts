import { Request, Response, NextFunction } from "express";
import Flower from "../models/Flower";
import User from "../models/User";
import Category from "../models/Category";
import { UserRole } from "../types/user.types";
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
    const flowers = await Flower.find().lean();
    res.json(flowers);
  } catch (error) {
    next(error);
  }
};

export const getFlowersBySellerId = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { sellerId } = req.params;

    const flowers = await Flower.find({
      seller: sellerId,
    }).lean();

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
    const sellers = await Seller.find().lean();
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
 * User CRUD Operations
 */
export const getUsers = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const users = await User.find({ role: UserRole.USER }).lean();
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
