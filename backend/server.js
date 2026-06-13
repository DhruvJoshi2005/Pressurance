import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";

import authRoutes from "./routes/authRoutes.js";
import userRoutes from "./routes/userRoutes.js"; // 🆕 Import the medical history routes

dotenv.config();

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// Routes
app.use("/api/auth", authRoutes); // Signup/Login
app.use("/api/users", userRoutes); // Medical History (Protected)

// MongoDB Connection
mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("✅ MongoDB connected");
    app.listen(5000, () =>
      console.log("🚀 Server running on http://localhost:5000")
    );
  })
  .catch((err) => console.error("❌ MongoDB connection error:", err));

  app.use((req, res) => {
    res.status(404).send(`❌ Route not found: ${req.originalUrl}`);
  });
  