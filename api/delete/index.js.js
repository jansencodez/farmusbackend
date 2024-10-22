import connectDB from "../../config/db";
import Product from "../../models/Product";
import User from "../../models/User"; // Import User model
import authenticateToken from "../../utils/authenticateToken";
import cloudinary from "../../config/cloudinary"; // Import Cloudinary configuration

export default async function handler(req, res) {
  // Ensure database connection
  await connectDB();

  // Only allow DELETE method
  if (req.method !== "DELETE") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  // Authenticate the user using the token
  return authenticateToken(req, res, async () => {
    const { id } = req.query; // Extract product ID from query params

    try {
      // Find the product by ID
      const product = await Product.findById(id);
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }

      // Check if the authenticated user is the creator of the product
      if (product.createdBy.toString() !== req.user.userId) {
        return res.status(403).json({ message: "Unauthorized" });
      }

      // If the product has an associated image in Cloudinary, delete it
      if (product.imageUrl) {
        const publicId = product.imageUrl.split("/").pop().split(".")[0]; // Extract Cloudinary public ID
        await cloudinary.uploader.destroy(publicId); // Delete image from Cloudinary
      }

      // Delete the product from the Product collection
      await Product.findByIdAndDelete(id);

      // Remove the product from the user's products array
      await User.findByIdAndUpdate(req.user.userId, {
        $pull: { products: id },
      });

      // Send success response
      res.json({
        message: "Product deleted successfully from the user and database",
      });
    } catch (error) {
      console.error("Error deleting product:", error);
      res.status(500).json({ message: "Server error" });
    }
  });
}
