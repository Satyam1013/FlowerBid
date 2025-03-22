import Flower from "../models/Flower";
import { FlowerStatus } from "../types/flower.types";

export const updateFlowerStatus = async () => {
  const currentTime = new Date();

  // Update flowers that should be LIVE
  await Flower.updateMany(
    { startTime: { $lte: currentTime }, endTime: { $gt: currentTime } },
    { $set: { status: FlowerStatus.LIVE } }
  );

  // Update flowers that should be UPCOMING
  await Flower.updateMany(
    { startTime: { $gt: currentTime } },
    { $set: { status: FlowerStatus.UPCOMING } }
  );

  // Update flowers that should be CLOSED
  await Flower.updateMany(
    { endTime: { $lte: currentTime } },
    { $set: { status: FlowerStatus.CLOSED } }
  );
};
