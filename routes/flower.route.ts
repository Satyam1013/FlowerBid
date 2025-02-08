// src/routes/flower.route.ts

import { Router } from "express";
import {
  getAvailableFlowers,
  placeBid,
} from "../controller/flower.controller";
import { authenticator } from "../middleware/authenticator";

const flowerRouter: Router = Router();

// GET /flowers - Retrieve all available flowers.
flowerRouter.get("/", getAvailableFlowers);

// POST /flowers/:flowerId/bid - Place a bid on a specific flower.
flowerRouter.post("/:flowerId/bid", authenticator, placeBid);

export default flowerRouter;
