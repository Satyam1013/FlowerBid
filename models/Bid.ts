import { Schema, model, Document, Types } from "mongoose";

export interface BidDocument extends Document {
  _id: Types.ObjectId;
  user: Types.ObjectId;
  flower: Types.ObjectId;
  amount: number;
  bidTime: Date;
  winningBid: boolean;
}

const bidSchema = new Schema<BidDocument>({
  user: { type: Schema.Types.ObjectId, ref: "User", required: true },
  flower: { type: Schema.Types.ObjectId, ref: "Flower", required: true },
  amount: { type: Number, required: true },
  bidTime: { type: Date, default: Date.now },
  winningBid: { type: Boolean, default: false },
});

const Bid = model<BidDocument>("bid", bidSchema);

export default Bid;
