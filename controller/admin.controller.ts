import { Request, Response, NextFunction } from "express";
import Flower from "../models/Flower";

// Create a new flower
export const addFlower = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { name, description, startingPrice, bidEndTime, isFavorite } = req.body;


    const flower = new Flower({
      name,
      description,
      startingPrice,
      bidEndTime,
      isFavorite 
    });

    await flower.save();
    res.status(201).json({ message: "Flower added successfully.", flower });
  } catch (error) {
    next(error);
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
