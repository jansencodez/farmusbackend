import connectDB from "../../config/db";
import Product from "../../models/Product";
import mongoose from "mongoose";

export default async function handler(req, res) {
  await connectDB();

  const { id } = req.query;

  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    // Validate the ObjectId format (optional, but recommended)
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid product ID format" });
    }

    // Find the product by ID
    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    // Return the product
    res.json(product);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
}
