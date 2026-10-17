import mongoose from "mongoose";

const productSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  sku: { type: String, required: true, unique: true, trim: true, uppercase: true },
  category: { type: String, required: true, trim: true },
  purchasePrice: { type: Number, required: true, min: 0, default: 0 },
  sellingPrice: { type: Number, required: true, min: 0, default: 0 },
  quantity: { type: Number, required: true, min: 0, default: 0 },
  minStock: { type: Number, required: true, min: 0, default: 5 },
  supplier: { type: String, trim: true, default: "" }
}, { timestamps: true });

export default mongoose.model("Product", productSchema);
