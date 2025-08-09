import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import axios from "axios";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const API_BASE = process.env.API_BASE || "http://localhost:5001";

const processPayloads = async () => {
  const folderPath = path.join(__dirname, "sample_payloads");
  if (!fs.existsSync(folderPath)) {
    console.warn("sample_payloads folder not found, skipping payload import.");
    return;
  }

  const files = fs.readdirSync(folderPath);

  for (const file of files) {
    const rawData = fs.readFileSync(path.join(folderPath, file));
    const data = JSON.parse(rawData);

    const messages = data?.entry?.[0]?.changes?.[0]?.value?.messages;
    const contacts = data?.entry?.[0]?.changes?.[0]?.value?.contacts;

    if (messages && contacts && contacts.length > 0) {
      const wa_id = contacts[0].wa_id;
      const name = contacts[0].profile?.name || contacts[0].name || null;

      for (const msg of messages) {
        const newMessage = {
          id: msg.id || `${wa_id}-${msg.timestamp}`,
          wa_id,
          from: wa_id,
          to: process.env.PLATFORM_WA_ID || "919999999999",
          message: msg.text?.body || msg?.caption || "",
          timestamp: Number(msg.timestamp),
          status: "sent",
          name,
          type: msg.type || "text"
        };

        await axios.post(`${API_BASE}/api/messages`, newMessage);
      }
    }

    const statuses = data?.statuses || data?.entry?.[0]?.changes?.[0]?.value?.statuses;
    if (Array.isArray(statuses)) {
      for (const status of statuses) {
        const idToUpdate = status.id || status.meta_msg_id;
        if (!idToUpdate) continue;
        await axios.patch(`${API_BASE}/api/messages/${idToUpdate}/status`, { status: status.status });
      }
    }
  }

  console.log("✅ All payloads processed.");
  process.exit(0);
};

processPayloads().catch(err => {
  console.error("Error processing payloads:", err);
  process.exit(1);
});
