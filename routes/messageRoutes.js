import express from "express";
import Message from "../models/Message.js";

const router = express.Router();

// GET all messages
router.get("/", async (req, res) => {
  try {
    const messages = await Message.find();
    res.status(200).json(messages);
  } catch (error) {
    console.error("Error fetching messages:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// POST new message (with duplicate prevention)
router.post("/", async (req, res) => {
  try {
    const { id, wa_id, from, to, message, timestamp, status, type, name } = req.body;

    if (!id || !wa_id || !from || !to || !message || !timestamp) {
      return res.status(400).json({ error: "Required fields missing" });
    }

    // check existing first
    const existing = await Message.findOne({ id });
    if (existing) {
      return res.status(200).json(existing);
    }

    const newMessage = await Message.create({
      id,
      wa_id,
      from,
      to,
      message,
      timestamp,
      status: status || "sent",
      type: type || "text",
      name: name || null,
    });

    // Emit new-message event
    try {
      const io = req.app.get("io");
      if (io) io.emit("new-message", newMessage);
    } catch (emitErr) {
      console.warn("Socket emit error (new-message):", emitErr);
    }

    res.status(201).json(newMessage);
  } catch (error) {
    if (error.code === 11000) {
      // duplicate key
      return res.status(200).json({ message: "Duplicate ignored" });
    }
    console.error("Error saving message:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// PATCH to update status (useful for webhook/status)
router.patch("/status", async (req, res) => {
  try {
    const { id, status } = req.body;
    if (!id || !status) return res.status(400).json({ error: "Missing id or status" });

    const updated = await Message.findOneAndUpdate({ id }, { $set: { status } }, { new: true });
    if (!updated) return res.status(404).json({ error: "Message not found" });

    // emit status update
    try {
      const io = req.app.get("io");
      if (io) io.emit("status-update", { id, status });
    } catch (emitErr) {
      console.warn("Socket emit error (status-update):", emitErr);
    }

    res.json(updated);
  } catch (err) {
    console.error("Error updating status:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// DELETE a message by id
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await Message.findOneAndDelete({ id });

    if (!deleted) return res.status(404).json({ error: "Message not found" });

    // emit delete-message
    try {
      const io = req.app.get("io");
      if (io) io.emit("delete-message", { id });
    } catch (emitErr) {
      console.warn("Socket emit error (delete-message):", emitErr);
    }

    res.status(200).json({ success: true });
  } catch (error) {
    console.error("Error deleting message:", error);
    res.status(500).json({ error: "Server error" });
  }
});

export default router;
