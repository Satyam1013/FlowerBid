import { Schema, model, Document, Types } from "mongoose";
import { FlowerDocument, flowerSchema } from "./Flower";

export enum UserRole {
  USER = "user",
  ADMIN = "admin",
  SELLER = "seller",
}

export interface BiddingStatus {
  flower: FlowerDocument;
  bidAmount: number;
  highestBid: boolean;
}

export interface UserDocument extends Document {
  username: string;
  email: string;
  password: string;
  mobile: number;
  role: UserRole;
  balance?: number;
  address?: string;
  image?: string;
  biddingStatus: BiddingStatus[];
  favoriteFlowers: Types.ObjectId[];
  flowers?: FlowerDocument[];
}

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
