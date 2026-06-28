import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import axios from "axios";
import fs from "fs";
import path from "path";
import os from "os"; // To dynamically get Desktop path

import authRoutes from "./routes/authRoutes.js";
import userRoutes from "./routes/userRoutes.js";

dotenv.config();

const app = express();
const PORT = process.env.EXPRESS_PORT || 5000;
const FLASK_URL = "http://localhost:5001"; // Flask backend URL

// ────────────────────────────
// 🛡️ Middlewares
// ────────────────────────────
app.use(cors());
app.use(express.json());

// ────────────────────────────
// 🔗 MongoDB Connection
// ────────────────────────────
mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("✅ Connected to MongoDB Atlas"))
  .catch((err) => console.error("❌ MongoDB connection error:", err));

// ────────────────────────────
// 🔘 Pain Area Logging Route
// ────────────────────────────
app.post("/log-click", (req, res) => {
  const { region } = req.body;
  if (!region) return res.status(400).send("Missing region in request body");

  // Dynamically get path to Desktop
  const desktopPath = path.join(os.homedir(), "OneDrive", "Desktop", "hackmol", "frontend", "pain-log.txt");

  const logEntry = `${region}\n`;

  fs.appendFile(desktopPath, logEntry, (err) => {
    if (err) {
      console.error("❌ Failed to write log:", err);
      return res.status(500).send("Failed to write log");
    }
    console.log(`📝 Logged: ${region}`);
    res.send("Logged successfully");
  });
});

// ────────────────────────────
// 🔗 Local Routes
// ────────────────────────────
app.get("/", (req, res) => {
  res.send("Hello from the Express backend");
});

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);

// ────────────────────────────
// 🔁 Flask Communication
// ────────────────────────────
app.post("/express-api", async (req, res) => {
  try {
    const flaskResponse = await axios.post(`${FLASK_URL}/flask-api`, req.body);
    res.json({
      message: "This came from Express!",
      flaskReply: flaskResponse.data,
    });
  } catch (err) {
    console.error("❌ Error talking to Flask:", err.message);
    res.status(500).json({ error: "Flask is not responding." });
  }
});

app.post("/api/predict-disease", async (req, res) => {
  try {
    const response = await axios.post(`${FLASK_URL}/predict-disease`, req.body);
    res.json(response.data);
  } catch (err) {
    res.status(500).json({ error: "Flask error", details: err.message });
  }
});

// ────────────────────────────
// ❌ Fallback for Unknown Routes
// ────────────────────────────
app.use((req, res) => {
  res.status(404).send(`❌ Route not found: ${req.originalUrl}`);
});

// ────────────────────────────
// 🚀 Start Server
// ────────────────────────────
app.listen(PORT, () => {
  console.log(`🚀 Express server running on http://localhost:${PORT}`);
});
