import { Schema, model, Document, Types } from "mongoose";
import { flowerSchema } from "./Flower";
import { BiddingStatus, UserDocument, UserRole } from "../types/user.types";

const biddingStatusSchema = new Schema<BiddingStatus>({
  flower: { type: flowerSchema, required: true },
  bidAmount: { type: Number, required: true },
  highestBid: { type: Boolean, required: true },
});

const userSchema = new Schema<UserDocument>({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  mobile: { type: Number, required: true, unique: true },
  role: { type: String, enum: Object.values(UserRole), default: UserRole.USER },
  balance: { type: Number, default: 0 },
  address: { type: String },
  image: { type: String },
  biddingStatus: { type: [biddingStatusSchema], default: [] },
  favoriteFlowers: [
    { type: Schema.Types.ObjectId, ref: "Flower", default: [] },
  ],
  flowers: [{ type: Schema.Types.ObjectId, ref: "Flower", default: [] }],
});

const User = model<UserDocument>("user", userSchema);

export default User;
