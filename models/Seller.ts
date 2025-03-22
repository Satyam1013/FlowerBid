import { model, Schema } from "mongoose";
import { UserRole } from "../types/user.types";

const sellerSchema = new Schema({
  username: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  mobile: { type: Number, required: true, unique: true },
  role: { type: String, enum: [UserRole.SELLER], default: UserRole.SELLER },
});

const Seller = model("Seller", sellerSchema);

export default Seller;
