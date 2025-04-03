import { Router } from "express";
import { createUPIOrder, verifyUPIPayment } from "../controller/payment.controller";
import { authenticator } from "../middleware/authenticator";

const paymentRouter: Router = Router();

paymentRouter.post("/upi/create-order", authenticator, createUPIOrder);

paymentRouter.post("/upi/verify-payment", authenticator, verifyUPIPayment);

export default paymentRouter;