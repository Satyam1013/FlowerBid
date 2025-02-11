import { Request, Response, NextFunction } from "express";
import Flower from "../models/Flower";
import Bid from "../models/Bid";
const { io } = require("../index");

export const addFlower = async (req: Request, res: Response) => {
  try {
    const { name, description, startingPrice, bidEndTime, isFavorite } = req.body;

    const flower = new Flower({ name, description, startingPrice, bidEndTime, isFavorite });
    await flower.save();

    // Schedule winner selection at bidEndTime
    const timeUntilEnd = new Date(bidEndTime).getTime() - Date.now();
    setTimeout(async () => {
      const highestBid = await Bid.findOne({ flower: flower._id })
        .sort({ amount: -1, bidTime: 1 })
        .populate("user");

      if (highestBid) {
        flower.winningBid = highestBid._id;
        await flower.save();

        // Notify all users about the winner
        io.emit("bidEnded", {
          flowerId: flower._id,
          winner: highestBid.user,
          amount: highestBid.amount,
        });

        console.log(
          `Winner announced for ${flower.name}: User ${highestBid.user} with ₹${highestBid.amount}`
        );
      }
    }, timeUntilEnd);

    res.status(201).json({ message: "Flower added successfully.", flower });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error." });
  }
};

// Update a flower by ID
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
      res.status(404).json({ error: "Flower not found." });
      return;
    }
    res.json({
      message: "Flower updated successfully.",
      flower: updatedFlower,
    });
  } catch (error) {
    next(error);
  }
};

// Get a single flower by ID
export const getFlower = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;

    const flower = await Flower.findById(id);
    if (!flower) {
      res.status(404).json({ error: "Flower not found." });
      return;
    }
    res.json(flower);
  } catch (error) {
    next(error);
  }
};

// Get all flowers
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

// Delete a flower by ID
export const deleteFlower = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;

    const deletedFlower = await Flower.findByIdAndDelete(id);
    if (!deletedFlower) {
      res.status(404).json({ error: "Flower not found." });
      return;
    }
    res.json({ message: "Flower deleted successfully." });
  } catch (error) {
    next(error);
  }
};

export const determineWinner = async (req: Request, res: Response) => {
  try {
    const { flowerId } = req.params;

    // Find the flower
    const flower = await Flower.findById(flowerId);
    if (!flower) {
      return res.status(404).json({ error: "Flower not found." });
    }

    // Check if the bidding time has ended
    if (new Date() < flower.bidEndTime) {
      return res.status(400).json({ error: "Bidding is still ongoing." });
    }

    // Find the highest bid for this flower
    const highestBid = await Bid.findOne({ flower: flowerId })
      .sort({ amount: -1 }) // Sort in descending order
      .populate("user", "name email"); // Populate user details

    if (!highestBid) {
      return res
        .status(200)
        .json({ message: "No bids were placed for this flower." });
    }

    // Update the flower document with the winning bid
    flower.winningBid = highestBid._id;
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
