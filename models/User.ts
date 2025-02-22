// models/User.ts
import { Schema, model, Document } from "mongoose";

export interface BiddingStatus {
  flowerId: string;
  flowerName: string;
  bidAmount: number;
  highestBid: boolean;
}

export interface UserDocument extends Document {
  username: string;
  email: string;
  password: string;
  mobile: number;
  role: "user" | "admin";
  balance?: number;
  address?: string;
  image?: string;
  biddingStatus: BiddingStatus[];
}

const biddingStatusSchema = new Schema<BiddingStatus>({
  flowerId: { type: String, required: true },
  flowerName: { type: String, required: true },
  bidAmount: { type: Number, required: true },
  highestBid: { type: Boolean, required: true },
});

const userSchema = new Schema<UserDocument>({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  mobile: { type: Number, required: true, unique: true },
  role: { type: String, enum: ["user", "admin"], default: "user" },
  balance: { type: Number, default: 0 },
  address: { type: String },
  image: { type: String },
  biddingStatus: { type: [biddingStatusSchema], default: [] },
});

const User = model<UserDocument>("user", userSchema);

export default User;
