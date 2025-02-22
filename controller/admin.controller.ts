import { Request, Response, NextFunction } from "express";
import Flower from "../models/Flower";
import Bid from "../models/Bid";
const { io } = require("../index");

export const addFlower = async (req: Request, res: Response) => {
  try {
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
      isFavorite,
    } = req.body;

    // Create a new Flower document
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
      isFavorite,
    });

    await flower.save();

    // Schedule winner selection at endDateTime
    const timeUntilEnd = new Date(endDateTime).getTime() - Date.now();
    setTimeout(async () => {
      try {
        // Find the highest bid for this flower
        const highestBid = await Bid.findOne({ flower: flower._id })
          .sort({ amount: -1, bidTime: 1 })
          .populate("user");

        if (highestBid) {
          flower.winningBid = highestBid._id;
          await flower.save();

          // Notify all connected clients about the winner
          io.emit("bidEnded", {
            flowerId: flower._id,
            winner: highestBid.user,
            amount: highestBid.amount,
          });

          console.log(
            `Winner announced for ${flower.name}: ` +
              `User ${highestBid.user} with ₹${highestBid.amount}`
          );
        }
      } catch (err) {
        console.error("Error determining winner:", err);
      }
    }, timeUntilEnd);

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
    const currentTime = new Date();
    console.log("🚀 ~ currentTime:", currentTime)
    const flowers = await Flower.find({
      status: { $in: ["live", "upcoming"] },
      endDateTime: { $gt: currentTime },
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
 * Manually Determine the Winner for a Flower
 */
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
    if (flower.status === "live" && currentTime < flower.endDateTime) {
      return res.status(400).json({ error: "Bidding is still ongoing." });
    }

    // Find the highest bid for this flower
    const highestBid = await Bid.findOne({ flower: flowerId })
      .sort({ amount: -1 })
      .populate("user", "name email");

    if (!highestBid) {
      return res.status(200).json({ message: "No bids were placed for this flower." });
    }

    // Update the flower document with the winning bid and update status
    flower.winningBid = highestBid._id;
    flower.status = "closed"; // mark the auction as closed
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