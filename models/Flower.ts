import { Schema, model, Document, Types } from "mongoose";

export interface IFlower {
  name: string;
  image: string;
  size: number;
  quantity: string;
  description?: string;
  category: Types.ObjectId;
  initialBidPrice: number;
  currentBidPrice: number;
  startTime: Date;
  endTime: Date;
  status: "live" | "upcoming" | "closed";
  lotNumber: number;
  winningBid?: Types.ObjectId;
  seller?: Types.ObjectId;
}

export interface FlowerDocument extends Document<Types.ObjectId>, IFlower {}

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
    enum: ["live", "upcoming", "closed"],
    default: "upcoming",
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
