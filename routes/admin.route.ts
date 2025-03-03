import { Router } from "express";
import {
  determineWinner,
  getUsers,
  deleteUser,
  getSellers,
  createCategory,
  createSeller,
  deleteSeller,
  getAllFlowers,
} from "../controller/admin.controller";
import { authenticator } from "../middleware/authenticator";
import { adminOnly } from "../middleware/admin.only";

const adminRouter = Router();

adminRouter.use(authenticator, adminOnly);

// Flower management routes
adminRouter.post("/declare-winner/:flowerId", determineWinner);

adminRouter.post("/add-category", createCategory);

adminRouter.get("/flowers", getAllFlowers);


// Seller management routes
adminRouter.post("/create-seller", createSeller);

adminRouter.get("/sellers", getSellers);

adminRouter.delete("/seller/:id", deleteSeller);

// User management routes
adminRouter.get("/users", getUsers);

adminRouter.delete("/users/:id", deleteUser);

export default adminRouter;
