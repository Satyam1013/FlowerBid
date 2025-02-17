import { Router } from "express";
import {
  getLiveFlowers,
  getUpcomingFlowers,
  placeBid,
  favoriteFlowers,
  addFavorite,
  getFlowersGroupedByCategory,
} from "../controller/flower.controller";

const flowerRouter: Router = Router();

flowerRouter.get("/live", getLiveFlowers);

flowerRouter.get("/upcoming", getUpcomingFlowers);

flowerRouter.post("/:flowerId/bid", placeBid);

flowerRouter.get("/favorites", favoriteFlowers);

flowerRouter.post("/:flowerId/add-favorite", addFavorite);

flowerRouter.get("/category", getFlowersGroupedByCategory)

export default flowerRouter;
