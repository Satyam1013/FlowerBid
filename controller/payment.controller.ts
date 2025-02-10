// src/controllers/payment.controller.ts
import { Request, Response } from "express";
import User from "../models/User";

// Define an extended Request type if needed
interface AuthenticatedRequest extends Request {
  user?: { _id: string };
}

/**
 * Simulate a UPI payment process and add funds to the user's balance.
 *
 * Expects a JSON body with:
 *  - upiId: string (the user's UPI ID)
 *  - amount: number (the amount to add)
 */
export const addFundsViaUPI = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    // Ensure the user is authenticated
    const userId = req.user?._id;
    if (!userId) {
      res.status(401).json({ error: "Not authenticated" });
      return;
    }

    // Extract payment details from the request body
    const { upiId, amount } = req.body;

    // Validate the incoming data
    if (!upiId || typeof upiId !== "string" || !amount || amount <= 0) {
      res.status(400).json({ error: "Invalid payment details" });
      return;
    }

    // In a real integration, you would call your UPI payment gateway API here.
    // For simulation purposes, we'll assume the payment is always successful.
    console.log(`Processing UPI payment. UPI ID: ${upiId}, Amount: ${amount}`);

    // Retrieve the user from the database and update the balance
    const user = await User.findById(userId);
    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    user.balance = (user.balance || 0) + amount;
    await user.save();

    res.json({
      message: "Payment successful. Funds added.",
      balance: user.balance,
    });
  } catch (error) {
    console.error("Error processing payment:", error);
    res.status(500).json({ error: "Payment processing error" });
  }
};
