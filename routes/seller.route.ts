import { Router } from "express";
import { authenticator } from "../middleware/authenticator";
import { sellerOnly } from "../middleware/seller.only";
import {
  addFlowerBySeller,
  deleteFlower,
  getAllFlowers,
  getFlower,
  updateFlower,
} from "../controller/seller.controller";

const sellerRouter = Router();

sellerRouter.use(authenticator, sellerOnly);

// Flower management routes
sellerRouter.post("/add-flowers", addFlowerBySeller);

sellerRouter.put("/flowers/:id", updateFlower);

sellerRouter.get("/flowers/:id", getFlower);

sellerRouter.get("/flowers", getAllFlowers);

sellerRouter.delete("/flowers/:id", deleteFlower);

// Seller management routes
sellerRouter.put("/:id", updateFlower);

export default sellerRouter;