import express from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User.js'; // Importing User using ES modules
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';
dotenv.config();

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'ourSuperSecretJWTkey';

// Signup route
router.post('/signup', async (req, res) => {
  const { name, email, password } = req.body;
  try {
    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Create new user
    const user = new User({ name, email, password: hashedPassword });
    await user.save();
    res.status(201).json({ message: 'User created successfully' });
  } catch (err) {
    res.status(400).json({ error: 'Signup failed', details: err });
  }
});

// Login route
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    // Find user by email
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ error: 'User not found' });

    // Compare the password with the hashed password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ error: 'Invalid credentials' });

    // Create a JWT token with user id and name
    const token = jwt.sign(
      { id: user._id, name: user.name }, 
      JWT_SECRET, 
      { expiresIn: '1h' }
    );
    
    // Return the token and user data
    res.json({ message: 'Login successful', token, user: { id: user._id, name: user.name } });
  } catch (err) {
    res.status(500).json({ error: 'Login failed', details: err });
  }
});

export default router; // Export the router as default
