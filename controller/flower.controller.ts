import { NextFunction, Request, Response } from "express";
import Flower from "../models/Flower";
import User from "../models/User";
import { FilterQuery } from "mongoose";
import mongoose from "mongoose";
import { FlowerStatus, IFlower } from "../types/flower.types";

interface AuthenticatedRequest extends Request {
  user?: { _id: string };
}

export const getAvailableFlowers = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const currentTime = new Date();

    const query: FilterQuery<IFlower> = {
      status: { $in: [FlowerStatus.LIVE, FlowerStatus.UPCOMING] },
    };

    const { name, category, minPrice, maxPrice, sort } = req.query;

    if (name) {
      query.name = { $regex: new RegExp(name as string, "i") };
    }

    if (category) {
      const categories = (category as string)
        .split(",")
        .map((cat) => cat.trim());
      query.category = { $in: categories };
    }

    if (minPrice || maxPrice) {
      query.initialBidPrice = {};
      if (minPrice) query.initialBidPrice.$gte = Number(minPrice);
      if (maxPrice) query.initialBidPrice.$lte = Number(maxPrice);
    }

    const sortOptions: Record<string, 1 | -1> = {};
    if (sort) {
      sortOptions.initialBidPrice = sort === "asc" ? 1 : -1;
    }

    // Fetch all matching flowers
    const flowers = await Flower.find(query).sort(sortOptions);

    const updatedFlowers = await Promise.all(
      flowers.map(async (flower) => {
        if (currentTime >= flower.endTime) {
          // If current time is past the endTime, set status to "CLOSED"
          flower.status = FlowerStatus.CLOSED;
          await flower.save();
        } else if (
          currentTime >= flower.startTime &&
          flower.status === FlowerStatus.UPCOMING
        ) {
          // If startTime is reached, update status to "LIVE"
          flower.status = FlowerStatus.LIVE;
          await flower.save();
        }
        return flower;
      })
    );

    // Filter only available flowers (startTime <= currentTime < endTime)
    const availableFlowers = updatedFlowers.filter(
      (flower) => flower.status === FlowerStatus.LIVE
    );

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
    // Upcoming flowers: scheduled to start in the future.
    // You can adjust conditions, e.g., startTime is in the future.
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
    const flowerObjectId = new mongoose.Types.ObjectId(flowerId);

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
