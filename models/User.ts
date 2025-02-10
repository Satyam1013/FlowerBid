// models/User.ts
import { Schema, model, Document } from "mongoose";

export interface UserDocument extends Document {
  username: string;
  email: string;
  password: string;
  role: "user" | "admin";
  balance: number;
}

const userSchema = new Schema<UserDocument>({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ["user", "admin"], default: "user" },
  balance: { type: Number, default: 0 }
});

const User = model<UserDocument>("user", userSchema);

export default User;
