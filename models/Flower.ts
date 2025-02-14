// models/Flower.ts
import { Schema, model, Document, Types } from "mongoose";

export interface FlowerDocument extends Document {
  _id: Types.ObjectId;
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
  isFavorite: boolean;
}

const flowerSchema = new Schema<FlowerDocument>({
  name: { type: String, required: true },
  image: { type: String, required: true },
  size: { type: Number, required: true },
  quantity: { type: String, required: true },
  category: { type: String, required: true },
  status: {
    type: String,
    required: true,
    enum: ["live", "upcoming", "closed"],
  },
  lotNumber: { type: Number, required: true },
  initialBidPrice: { type: Number, required: true },
  currentBidPrice: { type: Number, required: true },
  startDateTime: { type: Date, required: true },
  endDateTime: { type: Date, required: true },
  winningBid: { type: Schema.Types.ObjectId, ref: "Bid" },
  isFavorite: { type: Boolean, default: false },
});

const Flower = model<FlowerDocument>("flower", flowerSchema);

export default Flower;
