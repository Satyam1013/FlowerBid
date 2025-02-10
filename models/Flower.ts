import { Schema, model, Document, Types } from "mongoose";

export interface FlowerDocument extends Document {
  name: string;
  description?: string;
  startingPrice: number;
  bidEndTime: Date;
  winningBid?: Types.ObjectId;
  isFavorite: boolean;
}

const flowerSchema = new Schema<FlowerDocument>({
  name: { type: String, required: true },
  description: { type: String },
  startingPrice: { type: Number, required: true },
  bidEndTime: { type: Date, required: true },
  winningBid: { type: Schema.Types.ObjectId, ref: "Bid" },
  isFavorite: { type: Boolean }
});

const Flower = model<FlowerDocument>("flower", flowerSchema);

export default Flower;
