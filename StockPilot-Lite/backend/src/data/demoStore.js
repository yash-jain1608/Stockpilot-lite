import { randomUUID } from "node:crypto";

const now = Date.now();
export const demoStore = {
  products: [
    { _id: randomUUID(), name: "Wireless Mouse", sku: "ACC-001", category: "Accessories", purchasePrice: 450, sellingPrice: 699, quantity: 24, minStock: 5, supplier: "TechSource", createdAt: new Date(now - 86400000 * 18).toISOString() },
    { _id: randomUUID(), name: "Mechanical Keyboard", sku: "ACC-002", category: "Accessories", purchasePrice: 1800, sellingPrice: 2499, quantity: 4, minStock: 5, supplier: "KeyWorld", createdAt: new Date(now - 86400000 * 15).toISOString() },
    { _id: randomUUID(), name: "USB-C Hub", sku: "ACC-003", category: "Accessories", purchasePrice: 900, sellingPrice: 1299, quantity: 13, minStock: 4, supplier: "TechSource", createdAt: new Date(now - 86400000 * 12).toISOString() },
    { _id: randomUUID(), name: "27-inch Monitor", sku: "DIS-001", category: "Displays", purchasePrice: 11500, sellingPrice: 14999, quantity: 7, minStock: 3, supplier: "ViewPoint", createdAt: new Date(now - 86400000 * 9).toISOString() },
    { _id: randomUUID(), name: "Laptop Stand", sku: "OFF-001", category: "Office", purchasePrice: 650, sellingPrice: 999, quantity: 2, minStock: 5, supplier: "DeskMate", createdAt: new Date(now - 86400000 * 7).toISOString() },
    { _id: randomUUID(), name: "Webcam HD", sku: "ACC-004", category: "Accessories", purchasePrice: 1400, sellingPrice: 1899, quantity: 11, minStock: 4, supplier: "PixelWorks", createdAt: new Date(now - 86400000 * 4).toISOString() },
    { _id: randomUUID(), name: "SSD 1TB", sku: "STO-001", category: "Storage", purchasePrice: 5200, sellingPrice: 6499, quantity: 8, minStock: 3, supplier: "DataDrive", createdAt: new Date(now - 86400000 * 2).toISOString() }
  ],
  sales: [
    { _id: randomUUID(), product: null, productName: "Wireless Mouse", sku: "ACC-001", quantity: 2, unitPrice: 699, total: 1398, soldAt: new Date(now - 86400000 * 1).toISOString() },
    { _id: randomUUID(), product: null, productName: "USB-C Hub", sku: "ACC-003", quantity: 1, unitPrice: 1299, total: 1299, soldAt: new Date(now - 86400000 * 2).toISOString() },
    { _id: randomUUID(), product: null, productName: "Webcam HD", sku: "ACC-004", quantity: 3, unitPrice: 1899, total: 5697, soldAt: new Date(now - 86400000 * 3).toISOString() }
  ]
};
