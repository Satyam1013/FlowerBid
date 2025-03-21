import { Schema, model, Document } from "mongoose";

export interface CategoryDocument extends Document {
  name: string;
}

const categorySchema = new Schema<CategoryDocument>({
  name: { type: String, required: true, unique: true },
});

const Category = model<CategoryDocument>("category", categorySchema);

export default Category;
