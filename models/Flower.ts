import { Schema, model } from "mongoose";
import { FlowerDocument, FlowerStatus } from "../types/flower.types";

export const flowerSchema = new Schema<FlowerDocument>({
  name: { type: String, required: true },
  image: { type: String, required: true },
  size: { type: Number, required: true },
  description: { type: String, required: true },
  quantity: { type: String, required: true },
  category: { type: Schema.Types.ObjectId, ref: "Category", required: true },
  status: {
    type: String,
    required: true,
    enum: Object.values(FlowerStatus),
    default: FlowerStatus.UPCOMING,
  },
  lotNumber: { type: Number, required: true, unique: true },
  initialBidPrice: { type: Number, required: true },
  currentBidPrice: { type: Number, required: true },
  startTime: { type: Date, required: true },
  endTime: { type: Date, required: true },
  winningBid: { type: Schema.Types.ObjectId, ref: "Bid" },
  seller: { type: Schema.Types.ObjectId, ref: "User" },
});

const Flower = model<FlowerDocument>("flower", flowerSchema);

export default Flower;
