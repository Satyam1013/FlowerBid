import { Request, Response } from "express";
import Razorpay from "razorpay";
import crypto from "crypto";
import User from "../models/User";
import { AuthenticatedRequest } from "../middleware/authenticator";

// Initialize Razorpay instance
const razorpay = new Razorpay({
  key_id: "rzp_test_1FmiKa36oyTEwp", // Your Razorpay Test Key
  key_secret: "jM9oNOFvU0tWz0d1KOkP8RJs", // Your Razorpay Secret Key
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
      amount: amount * 100, // Razorpay works in paise (₹1 = 100 paise)
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
      key_id: "rzp_test_1FmiKa36oyTEwp", // Send Key ID to frontend
    });
  } catch (error) {
    console.error("Error creating UPI order:", error);
    res.status(500).json({ error: "Error creating payment order" });
  }
};

// Step 2: Verify Payment
export const verifyUPIPayment = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } =
      req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ error: "Payment verification failed" });
    }

    // Validate Signature
    const generatedSignature = crypto
      .createHmac("sha256", "jM9oNOFvU0tWz0d1KOkP8RJs")
      .update(razorpay_order_id + "|" + razorpay_payment_id)
      .digest("hex");

    if (generatedSignature !== razorpay_signature) {
      return res
        .status(400)
        .json({ error: "Invalid signature, payment not verified" });
    }

    // Retrieve order details from Razorpay
    const order = await razorpay.orders.fetch(razorpay_order_id);
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
      message: "Payment successful!",
      balance: user.balance,
    });
  } catch (error) {
    console.error("Error verifying UPI payment:", error);
    res.status(500).json({ error: "Payment verification error" });
  }
};
