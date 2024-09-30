import connectDB from '../config/db';
import Product from '../models/Product';

export default async function handler(req, res) {
  // Connect to the database
  await connectDB();

  // Ensure the request method is GET
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, message: 'Method Not Allowed' });
  }

  try {
    // Fetch all products from the database
    const products = await Product.find();

    // Transform products to remove MongoDB-specific types (Decimal128) and include Cloudinary image URL
    const transformedProducts = products.map(product => ({
      ...product.toObject(),
      price: product.price ? product.price.toString() : null, // Convert Decimal128 to string
      imageUrl: product.imageUrl // Ensure Cloudinary image URL is included
    }));

    // Return the transformed products
    return res.status(200).json(transformedProducts);
  } catch (error) {
    // Log the error for debugging purposes
    console.error('Error fetching products:', error);

    // Return a server error with the message
    return res.status(500).json({ success: false, message: 'Server Error' });
  }
}
