import { Router } from "express";
import {
  addFlower,
  updateFlower,
  getFlower,
  getAllFlowers,
  deleteFlower,
  determineWinner,
} from "../controller/admin.controller";
import { authenticator } from "../middleware/authenticator";
import { adminOnly } from "../middleware/admin.only";

const adminRouter = Router();

adminRouter.use(authenticator, adminOnly);

adminRouter.post("/add-flowers", addFlower);

adminRouter.put("/flowers/:id", updateFlower);

adminRouter.get("/flowers/:id", getFlower);

adminRouter.get("/flowers", getAllFlowers);

adminRouter.delete("/flowers/:id", deleteFlower);

adminRouter.post("/declare-winner/:flowerId", determineWinner);

export default adminRouter;
