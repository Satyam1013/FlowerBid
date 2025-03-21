import { Router } from "express";
import {
  getLiveFlowers,
  getUpcomingFlowers,
  // placeBid,
  getFavoriteFlowers,
  addFavoriteFlower,
  getFlowersGroupedByCategory,
  getAvailableFlowers,
  removeFavoriteFlower,
} from "../controller/flower.controller";
import { authenticator } from "../middleware/authenticator";

const flowerRouter: Router = Router();

flowerRouter.get("/available", getAvailableFlowers);

flowerRouter.get("/live", getLiveFlowers);

flowerRouter.get("/upcoming", getUpcomingFlowers);

flowerRouter.get("/category", getFlowersGroupedByCategory);

flowerRouter.get("/favorites", authenticator, getFavoriteFlowers);

flowerRouter.post("/:flowerId/add-favorite", authenticator, addFavoriteFlower);

flowerRouter.get(
  "/:flowerId/delete-favorite",
  authenticator,
  removeFavoriteFlower
);

export default flowerRouter;
