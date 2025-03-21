import { Router } from "express";
import { authenticator } from "../middleware/authenticator";
import { sellerOnly } from "../middleware/seller.only";
import {
  addFlowerBySeller,
  deleteFlower,
  getFlowersBySellerId,
  updateFlower,
  updateSeller,
} from "../controller/seller.controller";

const sellerRouter = Router();

sellerRouter.use(authenticator, sellerOnly);

// Flower management routes
sellerRouter.post("/add-flowers", addFlowerBySeller);

sellerRouter.put("/flowers/:id", updateFlower);

sellerRouter.get("/flowers", getFlowersBySellerId);

sellerRouter.delete("/flowers/:id", deleteFlower);

// Seller management routes
sellerRouter.put("/update", updateSeller);

export default sellerRouter;