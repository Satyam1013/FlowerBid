import { Document, Types } from "mongoose";

export enum FlowerStatus {
  LIVE = "live",
  UPCOMING = "upcoming",
  CLOSED = "closed",
}

export interface IFlower {
  name: string;
  image: string;
  size: number;
  quantity: string;
  description?: string;
  category: Types.ObjectId;
  initialBidPrice: number;
  currentBidPrice: number;
  startTime: Date;
  endTime: Date;
  status: FlowerStatus;
  lotNumber: number;
  winningBid?: Types.ObjectId;
  seller?: Types.ObjectId;
}

export interface FlowerDocument extends Document<Types.ObjectId>, IFlower {}
