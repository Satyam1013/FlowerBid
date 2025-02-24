import { Schema, model, Document, Types } from "mongoose";

export interface IFlower {
  name: string;
  image: string;
  size: number;
  quantity: string;
  category: string;
  status: "live" | "upcoming" | "closed";
  lotNumber: number;
  initialBidPrice: number;
  currentBidPrice: number;
  startDateTime: Date;
  endDateTime: Date;
  winningBid?: Types.ObjectId;
}

export interface FlowerDocument extends Document<Types.ObjectId>, IFlower {}

export const flowerSchema = new Schema<FlowerDocument>({
  name: { type: String, required: true },
  image: { type: String, required: true },
  size: { type: Number, required: true },
  quantity: { type: String, required: true },
  category: { type: String, required: true },
  status: {
    type: String,
    required: true,
    enum: ["live", "upcoming", "closed"],
    default: "upcoming",
  },
  lotNumber: { type: Number, required: true, unique: true },
  initialBidPrice: { type: Number, required: true },
  currentBidPrice: { type: Number, required: true },
  startDateTime: { type: Date, required: true },
  endDateTime: { type: Date, required: true },
  winningBid: { type: Schema.Types.ObjectId, ref: "Bid" },
});

const Flower = model<FlowerDocument>("Flower", flowerSchema);

export default Flower;
