import { Router } from "express";
import { authenticator } from "../middleware/authenticator";
import { sellerOnly } from "../middleware/seller.only";
import {
  addFlowerBySeller,
  deleteFlower,
  getCategories,
  getFlowersBySellerId,
  updateFlower,
  updateSeller,
} from "../controller/seller.controller";
import upload from "../utils/gridfs";

const sellerRouter = Router();

sellerRouter.use(authenticator, sellerOnly);

// Flower management routes
sellerRouter.post("/add-flowers", upload.single("image"), addFlowerBySeller);

sellerRouter.get("/categories", getCategories);

sellerRouter.put("/flowers/:id", updateFlower);

sellerRouter.get("/flowers", getFlowersBySellerId);

sellerRouter.delete("/flowers/:id", deleteFlower);

// Seller management routes
sellerRouter.put("/update", updateSeller);

export default sellerRouter;
