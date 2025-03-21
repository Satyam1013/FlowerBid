// src/routes/payment.route.ts
import { Router } from "express";
import { addFundsViaUPI } from "../controller/payment.controller";
import { authenticator } from "../middleware/authenticator";

const router: Router = Router();

// POST /api/payment/addFunds - Allows a user to add funds via UPI.
router.post("/addFunds", authenticator, addFundsViaUPI);

export default router;