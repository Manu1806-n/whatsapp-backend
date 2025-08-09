import mongoose from "mongoose";

const messageSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true, index: true }, // unique id
  wa_id: { type: String, required: true },
  from: { type: String, required: true },
  to: { type: String, required: true },
  message: { type: String, required: true },
  timestamp: { type: Number, required: true }, // Number (seconds)
  status: {
    type: String,
    enum: ["sent", "delivered", "read"],
    default: "sent",
  },
  type: { type: String, default: "text" },
  name: { type: String, default: null },
}, { timestamps: true });

// ensure index exists
messageSchema.index({ id: 1 }, { unique: true });

export default mongoose.model("Message", messageSchema, "processed_messages");
