import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import User from '../models/User'; // Ensure this path is correct
import upload from '../utils/upload'; // Import the file upload middleware
import connectDB from '../config/db';
import cloudinary from '../config/cloudinary'; // Import Cloudinary configuration

export default async function handler(req, res) {
  await connectDB();

  // Apply the upload middleware to handle file uploads (for profile image)
  upload.single('profilePicture')(req, res, async (err) => {
    if (err) {
      return res.status(400).json({ message: 'File upload error' });
    }

    const { name, email, password } = req.body;
    let profilePicture = req.file ? req.file.path : null; // Get the uploaded image file

    try {
      // Check if the user already exists
      let user = await User.findOne({ email });
      if (user) {
        return res.status(400).json({ message: 'User already exists' });
      }

      // If profilePicture is provided, upload it to Cloudinary
      let profilePictureUrl = null;
      if (profilePicture) {
        const cloudinaryResponse = await cloudinary.uploader.upload(profilePicture, {
          folder: 'profile_images',
          use_filename: true,
          unique_filename: false,
        });
        profilePictureUrl = cloudinaryResponse.secure_url; // Get the URL of the uploaded image
      }

      // Create the new user with profile picture URL (if uploaded)
      user = new User({
        name,
        email,
        password,
        profilePicture: profilePictureUrl, // Store Cloudinary image URL
      });

      // Save the user to the database
      await user.save();

      // Generate a JWT token
      const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '30m' });

      // Send the response with the JWT token
      res.status(201).json({ token });
    } catch (err) {
      console.error('Error during sign up:', err);
      res.status(500).json({ message: 'Server error' });
    }
  });
}
