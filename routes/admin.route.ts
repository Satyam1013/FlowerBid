import { Router } from "express";
import {
  getUsers,
  deleteUser,
  getSellers,
  createCategory,
  createSeller,
  deleteSeller,
  getAllFlowers,
  getCategories,
  getFlowersBySellerId,
} from "../controller/admin.controller";
import { authenticator } from "../middleware/authenticator";
import { adminOnly } from "../middleware/admin.only";

const adminRouter = Router();

adminRouter.use(authenticator, adminOnly);

// Flower management routes
adminRouter.post("/add-category", createCategory);

adminRouter.get("/categories", getCategories);

adminRouter.get("/flowers", getAllFlowers);

adminRouter.get("/:sellerId/seller-flowers", getFlowersBySellerId);

// Seller management routes
adminRouter.post("/create-seller", createSeller);

adminRouter.get("/sellers", getSellers);

adminRouter.delete("/delete-seller/:id", deleteSeller);

// User management routes
adminRouter.get("/users", getUsers);

adminRouter.delete("/users/:id", deleteUser);

export default adminRouter;
