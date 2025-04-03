import { NextFunction, Request, Response } from "express";
import Flower from "../models/Flower";
import User from "../models/User";
import { FilterQuery, Types } from "mongoose";
import { FlowerStatus, IFlower } from "../types/flower.types";
import { updateFlowerStatus } from "./update-flower";
import { AuthenticatedRequest } from "../middleware/authenticator";

export const getAvailableFlowers = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    await updateFlowerStatus();

    const { category, minPrice, maxPrice, sortBy, sortOrder } = req.query;

    // Construct the filter query
    const query: FilterQuery<IFlower> = {
      status: { $in: [FlowerStatus.LIVE, FlowerStatus.UPCOMING] },
    };

    if (category) {
      query.category = category as string;
    }
    if (minPrice || maxPrice) {
      query.currentBidPrice = {};
      if (minPrice) query.currentBidPrice.$gte = Number(minPrice);
      if (maxPrice) query.currentBidPrice.$lte = Number(maxPrice);
    }

    // Sorting (using 1 for ascending and -1 for descending)
    const sort: Record<string, 1 | -1> = {};
    if (sortBy) {
      sort[sortBy as string] = sortOrder === "desc" ? -1 : 1;
    }

    // Fetch flowers with filters and sorting
    const availableFlowers = await Flower.find(query).sort(sort);

    res.json(availableFlowers);
  } catch (error) {
    next(error);
  }
};

export const getFlowersGroupedByCategory = async (
  req: Request,
  res: Response
) => {
  try {
    await updateFlowerStatus();

    const groupedFlowers = await Flower.aggregate([
      {
        $group: {
          _id: "$category",
          flowers: { $push: "$$ROOT" },
        },
      },
      {
        $project: {
          _id: 0,
          category: "$_id",
          flowers: { $slice: ["$flowers", 5] },
        },
      },
    ]);

    res.json(groupedFlowers);
  } catch (error) {
    console.error("Error fetching flowers grouped by category:", error);
    res.status(500).json({ error: "Server error." });
  }
};

export const getLiveFlowers = async (req: Request, res: Response) => {
  try {
    await updateFlowerStatus();

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
    await updateFlowerStatus();

    const flowers = await Flower.find({
      status: FlowerStatus.UPCOMING,
    });
    res.json(flowers);
  } catch (error) {
    console.error("Error fetching upcoming flowers:", error);
    res.status(500).json({ error: "Server error." });
  }
};

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

    const flowerObjectId = new Types.ObjectId(flowerId);

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
