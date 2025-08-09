// scripts/migrate_add_ids_and_dedupe.js
import dotenv from "dotenv";
dotenv.config();

import mongoose from "mongoose";
import Message from "../models/Message.js";

const MONGO_URI = process.env.MONGO_URI;
const PLATFORM_WA_ID = process.env.PLATFORM_WA_ID || "919999999999";

if (!MONGO_URI) {
  console.error("Please set MONGO_URI in .env");
  process.exit(1);
}

const run = async () => {
  await mongoose.connect(MONGO_URI);
  console.log("Connected to MongoDB for migration...");

  // 1) Add id for docs missing it (use _id string)
  const withoutId = await Message.find({ id: { $exists: false } });
  console.log(`Found ${withoutId.length} messages without id`);

  for (const doc of withoutId) {
    const newId = String(doc._id);
    await Message.updateOne({ _id: doc._id }, { $set: { id: newId } });
  }

  // 2) Fill missing from/to (assume incoming if missing)
  const missingFrom = await Message.find({ from: { $exists: false } });
  console.log(`Found ${missingFrom.length} messages without 'from' - setting from=wa_id, to=PLATFORM`);
  for (const doc of missingFrom) {
    const fromVal = doc.wa_id || PLATFORM_WA_ID;
    await Message.updateOne({ _id: doc._id }, { $set: { from: fromVal, to: PLATFORM_WA_ID } });
  }

  // 3) Deduplicate exact duplicates (same wa_id, message, timestamp)
  const dupGroups = await Message.aggregate([
    { $group: { _id: { wa_id: "$wa_id", message: "$message", timestamp: "$timestamp" }, ids: { $push: "$_id" }, count: { $sum: 1 } } },
    { $match: { count: { $gt: 1 } } }
  ]);

  let removedTotal = 0;
  for (const g of dupGroups) {
    // keep the first id, remove the rest
    const ids = g.ids.map(String);
    const keep = ids.shift();
    const toRemove = ids;
    if (toRemove.length) {
      const result = await Message.deleteMany({ _id: { $in: toRemove } });
      removedTotal += result.deletedCount || 0;
    }
  }

  console.log(`Migration done. IDs added to ${withoutId.length} docs. Duplicates removed: ${removedTotal}`);
  await mongoose.disconnect();
  process.exit(0);
};

run().catch(err => {
  console.error("Migration error:", err);
  process.exit(1);
});
