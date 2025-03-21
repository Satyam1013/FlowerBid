import { model, Schema } from "mongoose";
import { UserRole } from "../types/user.types";

const adminSchema = new Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: [UserRole.ADMIN], default: UserRole.ADMIN },
});

const Admin = model("Admin", adminSchema);
export default Admin;
