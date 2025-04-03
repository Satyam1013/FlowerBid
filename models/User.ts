import { Schema, model } from "mongoose";
import { BiddingStatus, UserDocument, UserRole } from "../types/user.types";

const biddingStatusSchema = new Schema<BiddingStatus>({
  flower: { type: Schema.Types.ObjectId, ref: "Flower", required: true },
  bidAmount: { type: Number, required: true },
  highestBid: { type: Boolean, required: true },
});

const userSchema = new Schema<UserDocument>({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  mobile: { type: Number, required: true, unique: true },
  role: { type: String, enum: [UserRole.USER], default: UserRole.USER },
  balance: { type: Number, default: 0 },
  address: { type: String },
  image: { type: String },
  biddingStatus: { type: [biddingStatusSchema], default: [] },
  favoriteFlowers: [
    { type: Schema.Types.ObjectId, ref: "Flower", default: [] },
  ],
});

const User = model<UserDocument>("User", userSchema);

export default User;
