import mongoose from 'mongoose';
import Product from '../models/Product';
import User from '../models/User';
import authenticateToken from '../utils/authenticateToken';
import upload from '../utils/upload'; // multer middleware
import connectDB from '../config/db';
import cloudinary from '../config/cloudinary'; // Cloudinary config

export default async function handler(req, res) {
  await connectDB();

  // Authenticate the user
  authenticateToken(req, res, async () => {
    // Apply the upload middleware to handle file uploads
    upload.single('productImage')(req, res, async (err) => {
      if (err) {
        console.error('File upload error:', err); // Log the upload error
        return res.status(400).json({ message: 'File upload error' });
      }

      const { name, description, price, category } = req.body;
      const productImage = req.file; // Get the uploaded image file

      try {
        let imageUrl = null;

        // If an image was uploaded, upload it to Cloudinary
        if (productImage) {
          // Upload to Cloudinary using the file's path
          const result = await cloudinary.uploader.upload(productImage.path);
          imageUrl = result.secure_url; // Get the Cloudinary image URL
        }

        // Convert price to Decimal128 if provided
        const formattedPrice = price ? mongoose.Types.Decimal128.fromString(price) : null;

        // Create a new product
        const product = new Product({
          name,
          description,
          price: formattedPrice,
          imageUrl, // Use Cloudinary image URL
          category,
          createdBy: req.user.userId, // User's ID from the token
        });

        // Save the product to the database
        await product.save();

        // Associate the product with the user
        await User.findByIdAndUpdate(req.user.userId, { $push: { products: product._id } });

        // Send a success response
        res.status(201).json({ message: 'Product created successfully', product });
      } catch (err) {
        console.error('Error creating product:', err); // Log the error for debugging
        res.status(500).json({ message: 'Server error' });
      }
    });
  });
};
