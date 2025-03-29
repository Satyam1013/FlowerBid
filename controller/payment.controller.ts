import { Response } from "express";
import Razorpay from "razorpay";
import crypto from "crypto";
import User from "../models/User";
import { AuthenticatedRequest } from "../middleware/authenticator";
import dotenv from "dotenv";

dotenv.config(); // Load .env variables

const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID;
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET;

if (!RAZORPAY_KEY_ID || !RAZORPAY_KEY_SECRET) {
  throw new Error("❌ Missing Razorpay credentials in .env file!");
}

// Initialize Razorpay instance
const razorpay = new Razorpay({
  key_id: RAZORPAY_KEY_ID,
  key_secret: RAZORPAY_KEY_SECRET,
});

// Step 1: Create Order
export const createUPIOrder = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const { amount, upiId } = req.body;
    if (!amount || amount <= 0) {
      return res.status(400).json({ error: "Invalid amount" });
    }

    const options = {
      amount: amount * 100, // Convert INR to paise
      currency: "INR",
      receipt: `receipt_${Date.now()}`,
      payment_capture: 1, // Auto capture payment
    };

    const order = await razorpay.orders.create(options);

    res.json({
      success: true,
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      upiId,
      key_id: RAZORPAY_KEY_ID, // Send Key ID to frontend
    });
  } catch (error) {
    console.error("❌ Error creating UPI order:", error);
    res.status(500).json({ error: "Error creating payment order" });
  }
};

// Step 2: Verify Payment
export const verifyUPIPayment = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const { order_id, payment_id, signature } =
      req.body;

    if (!order_id || !payment_id || !signature) {
      return res.status(400).json({ error: "Payment verification failed" });
    }

    // Validate Signature using Secret Key from .env
    const generatedSignature = crypto
      .createHmac("sha256", RAZORPAY_KEY_SECRET)
      .update(`${order_id}|${payment_id}`)
      .digest("hex");

    if (generatedSignature !== signature) {
      return res
        .status(400)
        .json({ error: "Invalid signature, payment not verified" });
    }

    // Retrieve order details from Razorpay
    const order = await razorpay.orders.fetch(order_id);
    if (!order || order.status !== "paid") {
      return res.status(400).json({ error: "Order not found or not paid" });
    }

    // Update User Balance
    const user = await User.findById(req.user?._id);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const amountInINR = Number(order.amount) / 100; // Convert paise to INR
    user.balance = (user.balance || 0) + amountInINR;
    await user.save();

    res.json({
      success: true,
      message: "✅ Payment successful!",
      balance: user.balance,
    });
  } catch (error) {
    console.error("❌ Error verifying UPI payment:", error);
    res.status(500).json({ error: "Payment verification error" });
  }
};
