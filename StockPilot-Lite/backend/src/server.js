import express from "express";
import { randomUUID } from "node:crypto";
import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose";
import Product from "./models/Product.js";
import Sale from "./models/Sale.js";
import { demoStore } from "./data/demoStore.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const demoMode = process.env.USE_DEMO_DATA !== "false" || !process.env.MONGODB_URI;

app.use(cors({ origin: true }));
app.use(express.json());

const cleanProduct = (p) => ({
  _id: String(p._id),
  name: p.name,
  sku: p.sku,
  category: p.category,
  purchasePrice: Number(p.purchasePrice),
  sellingPrice: Number(p.sellingPrice),
  quantity: Number(p.quantity),
  minStock: Number(p.minStock),
  supplier: p.supplier || "",
  createdAt: p.createdAt || p.created_at || new Date().toISOString()
});

function validateProduct(body) {
  const required = ["name", "sku", "category"];
  for (const field of required) {
    if (!String(body[field] ?? "").trim()) return `${field} is required.`;
  }
  for (const field of ["purchasePrice", "sellingPrice", "quantity", "minStock"]) {
    const value = Number(body[field]);
    if (!Number.isFinite(value) || value < 0) return `${field} must be zero or greater.`;
  }
  if (!Number.isInteger(Number(body.quantity)) || !Number.isInteger(Number(body.minStock))) {
    return "Quantity and minimum stock must be whole numbers.";
  }
  return null;
}

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", mode: demoMode ? "demo" : "mongodb" });
});

app.get("/api/products", async (req, res, next) => {
  try {
    const search = String(req.query.search || "").trim().toLowerCase();
    const category = String(req.query.category || "").trim();
    let products;
    if (demoMode) {
      products = demoStore.products.map(cleanProduct);
    } else {
      const filter = {};
      if (category && category !== "All categories") filter.category = category;
      if (search) filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { sku: { $regex: search, $options: "i" } }
      ];
      products = (await Product.find(filter).sort({ createdAt: -1 })).map(cleanProduct);
    }
    if (demoMode && category && category !== "All categories") {
      products = products.filter(p => p.category === category);
    }
    if (demoMode && search) {
      products = products.filter(p => p.name.toLowerCase().includes(search) || p.sku.toLowerCase().includes(search));
    }
    res.json(products);
  } catch (err) { next(err); }
});

app.post("/api/products", async (req, res, next) => {
  try {
    const error = validateProduct(req.body);
    if (error) return res.status(400).json({ message: error });
    const payload = {
      name: String(req.body.name).trim(),
      sku: String(req.body.sku).trim().toUpperCase(),
      category: String(req.body.category).trim(),
      purchasePrice: Number(req.body.purchasePrice),
      sellingPrice: Number(req.body.sellingPrice),
      quantity: Number(req.body.quantity),
      minStock: Number(req.body.minStock),
      supplier: String(req.body.supplier || "").trim()
    };
    if (demoMode) {
      if (demoStore.products.some(p => p.sku.toUpperCase() === payload.sku)) {
        return res.status(409).json({ message: "A product with this SKU already exists." });
      }
      const product = { _id: randomUUID(), ...payload, createdAt: new Date().toISOString() };
      demoStore.products.unshift(product);
      return res.status(201).json(cleanProduct(product));
    }
    const product = await Product.create(payload);
    res.status(201).json(cleanProduct(product));
  } catch (err) {
    if (err.code === 11000) return res.status(409).json({ message: "A product with this SKU already exists." });
    next(err);
  }
});

app.put("/api/products/:id", async (req, res, next) => {
  try {
    const error = validateProduct(req.body);
    if (error) return res.status(400).json({ message: error });
    const payload = {
      name: String(req.body.name).trim(),
      sku: String(req.body.sku).trim().toUpperCase(),
      category: String(req.body.category).trim(),
      purchasePrice: Number(req.body.purchasePrice),
      sellingPrice: Number(req.body.sellingPrice),
      quantity: Number(req.body.quantity),
      minStock: Number(req.body.minStock),
      supplier: String(req.body.supplier || "").trim()
    };
    let product;
    if (demoMode) {
      const index = demoStore.products.findIndex(p => String(p._id) === req.params.id);
      if (index < 0) return res.status(404).json({ message: "Product not found." });
      if (demoStore.products.some((p, i) => i !== index && p.sku.toUpperCase() === payload.sku)) {
        return res.status(409).json({ message: "A product with this SKU already exists." });
      }
      demoStore.products[index] = { ...demoStore.products[index], ...payload };
      product = demoStore.products[index];
    } else {
      product = await Product.findByIdAndUpdate(req.params.id, payload, { new: true, runValidators: true });
      if (!product) return res.status(404).json({ message: "Product not found." });
    }
    res.json(cleanProduct(product));
  } catch (err) {
    if (err.code === 11000) return res.status(409).json({ message: "A product with this SKU already exists." });
    next(err);
  }
});

app.delete("/api/products/:id", async (req, res, next) => {
  try {
    if (demoMode) {
      const index = demoStore.products.findIndex(p => String(p._id) === req.params.id);
      if (index < 0) return res.status(404).json({ message: "Product not found." });
      const [removed] = demoStore.products.splice(index, 1);
      demoStore.sales = demoStore.sales.filter(s => String(s.product) !== String(removed._id));
      return res.json({ message: "Product deleted." });
    }
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) return res.status(404).json({ message: "Product not found." });
    res.json({ message: "Product deleted." });
  } catch (err) { next(err); }
});

app.get("/api/sales", async (_req, res, next) => {
  try {
    const sales = demoMode
      ? [...demoStore.sales].sort((a, b) => new Date(b.soldAt) - new Date(a.soldAt))
      : await Sale.find().sort({ soldAt: -1 }).limit(100).lean();
    res.json(sales.map(s => ({
      _id: String(s._id),
      product: s.product ? String(s.product) : null,
      productName: s.productName,
      sku: s.sku,
      quantity: Number(s.quantity),
      unitPrice: Number(s.unitPrice),
      total: Number(s.total),
      soldAt: s.soldAt
    })));
  } catch (err) { next(err); }
});

app.post("/api/sales", async (req, res, next) => {
  try {
    const productId = String(req.body.productId || "");
    const quantity = Number(req.body.quantity);
    if (!productId) return res.status(400).json({ message: "Choose a product." });
    if (!Number.isInteger(quantity) || quantity < 1) return res.status(400).json({ message: "Sale quantity must be a whole number greater than zero." });

    if (demoMode) {
      const product = demoStore.products.find(p => String(p._id) === productId);
      if (!product) return res.status(404).json({ message: "Product not found." });
      if (product.quantity < quantity) return res.status(400).json({ message: "Not enough stock available." });
      product.quantity -= quantity;
      const sale = {
        _id: randomUUID(), product: product._id, productName: product.name,
        sku: product.sku, quantity, unitPrice: product.sellingPrice,
        total: Number((product.sellingPrice * quantity).toFixed(2)), soldAt: new Date().toISOString()
      };
      demoStore.sales.unshift(sale);
      return res.status(201).json(sale);
    }

    const session = await mongoose.startSession();
    let sale;
    try {
      await session.withTransaction(async () => {
        const product = await Product.findById(productId).session(session);
        if (!product) {
          const e = new Error("Product not found."); e.status = 404; throw e;
        }
        if (product.quantity < quantity) {
          const e = new Error("Not enough stock available."); e.status = 400; throw e;
        }
        product.quantity -= quantity;
        await product.save({ session });
        const created = await Sale.create([{
          product: product._id, productName: product.name, sku: product.sku,
          quantity, unitPrice: product.sellingPrice,
          total: Number((product.sellingPrice * quantity).toFixed(2)), soldAt: new Date()
        }], { session });
        sale = created[0];
      });
    } finally {
      await session.endSession();
    }
    res.status(201).json({
      _id: String(sale._id), product: String(sale.product), productName: sale.productName,
      sku: sale.sku, quantity: sale.quantity, unitPrice: sale.unitPrice,
      total: sale.total, soldAt: sale.soldAt
    });
  } catch (err) { next(err); }
});

app.get("/api/dashboard", async (_req, res, next) => {
  try {
    const products = demoMode ? demoStore.products.map(cleanProduct) : (await Product.find()).map(cleanProduct);
    const sales = demoMode ? demoStore.sales : await Sale.find().lean();
    const categoryCounts = {};
    for (const p of products) categoryCounts[p.category] = (categoryCounts[p.category] || 0) + 1;
    const now = new Date();
    const thisMonthSales = sales.filter(s => {
      const d = new Date(s.soldAt);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    });
    res.json({
      totalProducts: products.length,
      totalUnits: products.reduce((sum, p) => sum + p.quantity, 0),
      inventoryValue: Number(products.reduce((sum, p) => sum + p.quantity * p.purchasePrice, 0).toFixed(2)),
      lowStockCount: products.filter(p => p.quantity <= p.minStock).length,
      totalSalesRevenue: Number(sales.reduce((sum, s) => sum + s.total, 0).toFixed(2)),
      monthSalesRevenue: Number(thisMonthSales.reduce((sum, s) => sum + s.total, 0).toFixed(2)),
      categoryCounts: Object.entries(categoryCounts).map(([category, count]) => ({ category, count }))
    });
  } catch (err) { next(err); }
});

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(err.status || 500).json({ message: err.message || "Unexpected server error." });
});

async function start() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected to MongoDB.");
  } catch (err) {
    console.error("MongoDB connection failed:", err.message);
    process.exit(1);
  }
  app.listen(PORT, () => console.log(`StockPilot API running at http://localhost:${PORT}`));
}

start();
