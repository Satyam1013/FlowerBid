import { Router } from "express";
import {
  addFlower,
  updateFlower,
  getFlower,
  getAllFlowers,
  deleteFlower,
} from "../controller/admin.controller";
import { authenticator } from "../middleware/authenticator";

const adminRouter = Router();

adminRouter.use(authenticator);
adminRouter.post("/flowers", addFlower);
adminRouter.put("/flowers/:id", updateFlower);
adminRouter.get("/flowers/:id", getFlower);
adminRouter.get("/flowers", getAllFlowers);
adminRouter.delete("/flowers/:id", deleteFlower);

export default adminRouter;
