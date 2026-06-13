import express from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import verifyToken from '../middleware/verifyToken.js';

const router = express.Router();

router.post('/medical-history', verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    user.medicalHistory = req.body;
    await user.save();
    res.json({ message: 'Medical history saved.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
