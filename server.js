import express from "express";
import http from "http";
import { Server } from "socket.io";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import Message from "./models/Message.js";

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.CORS_ORIGIN || "*",
    methods: ["GET", "POST", "DELETE", "PATCH"]
  }
});

app.use(cors({ origin: process.env.CORS_ORIGIN || "*" }));
app.use(express.json());

// MongoDB
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("✅ MongoDB connected"))
  .catch(err => console.error("MongoDB connection error:", err));

/* ========== API Routes ========== */

// GET all messages
app.get("/api/messages", async (req, res) => {
  const messages = await Message.find().sort({ timestamp: 1 });
  res.json(messages);
});

// POST new message
app.post("/api/messages", async (req, res) => {
  try {
    const msg = await Message.findOneAndUpdate(
      { id: req.body.id },
      { $set: req.body },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    // Emit socket event for real-time
    io.emit("new-message", msg);

    res.status(201).json(msg);
  } catch (err) {
    res.status(500).json({ error: "Failed to save message" });
  }
});

// PATCH message status
app.patch("/api/messages/:id/status", async (req, res) => {
  try {
    const updated = await Message.findOneAndUpdate(
      { id: req.params.id },
      { $set: { status: req.body.status } },
      { new: true }
    );

    if (updated) {
      io.emit("status-update", { id: updated.id, status: updated.status });
    }

    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: "Failed to update status" });
  }
});

// DELETE message
app.delete("/api/messages/:id", async (req, res) => {
  try {
    await Message.deleteOne({ id: req.params.id });
    io.emit("delete-message", { id: req.params.id });
    res.sendStatus(204);
  } catch (err) {
    res.status(500).json({ error: "Failed to delete message" });
  }
});

/* ========== Socket.IO Connection ========== */
io.on("connection", (socket) => {
  console.log(`🔌 Socket connected: ${socket.id}`);
  socket.on("disconnect", () => {
    console.log(`❌ Socket disconnected: ${socket.id}`);
  });
});

const PORT = process.env.PORT || 5001;
server.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
