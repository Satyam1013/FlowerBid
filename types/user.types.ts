import { Types } from "mongoose";
import { FlowerDocument } from "./flower.types";

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
