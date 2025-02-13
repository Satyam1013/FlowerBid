// models/Flower.ts
import { Schema, model, Document, Types } from "mongoose";

export interface FlowerDocument extends Document {
  name: string;
  image: string;
  size: number;
  quantity: string;
  category: string;
  isLive: boolean;
  upcoming: boolean;
  isClosed: boolean;
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
  isLive: { type: Boolean, required: true },
  upcoming: { type: Boolean, required: true },
  isClosed: { type: Boolean, required: true },
  lotNumber: { type: Number, required: true },
  initialBidPrice: { type: Number, required: true },
  currentBidPrice: { type: Number, required: true },
  startDateTime: { type: Date, required: true },
  endDateTime: { type: Date, required: true },
  winningBid: { type: Schema.Types.ObjectId, ref: "Bid" },
  isFavorite: { type: Boolean, default: false },
});

// Pre-validation hook to ensure exactly one status flag is true
flowerSchema.pre("validate", function (next) {
  const live = this.isLive;
  const upcoming = this.upcoming;
  const closed = this.isClosed;
  const trueCount = [live, upcoming, closed].filter((flag) => flag === true).length;
  if (trueCount !== 1) {
    next(new Error("Exactly one of isLive, upcoming, or isClosed must be true."));
  } else {
    next();
  }
});

const Flower = model<FlowerDocument>("flower", flowerSchema);

export default Flower;
