# 💬 WhatsApp Web Clone – Backend

A Node.js + Express + MongoDB backend for processing and serving WhatsApp-like webhook payloads.  
Designed to work with the [whatsapp-frontend](https://github.com/Manu1806-n/whatsapp-frontend).

---

## 🚀 Live API
- **Backend API URL:** [https://whatsapp-backend-9b43.onrender.com](https://whatsapp-backend-9b43.onrender.com)  
- **Frontend Demo:** [https://whatsapp-frontend-flax.vercel.app](https://whatsapp-frontend-flax.vercel.app)

---

## 📌 Features
- Reads & processes WhatsApp Business API–style webhook payloads
- Saves messages in MongoDB Atlas (`processed_messages` collection)
- Updates message statuses (sent, delivered, read)
- Provides REST API endpoints for frontend
- Sends real-time message/status updates via Socket.IO

---

## 📂 API Endpoints
| Method | Endpoint                         | Description                           |
|--------|----------------------------------|---------------------------------------|
| GET    | `/api/messages`                  | Fetch all messages                    |
| POST   | `/api/messages`                  | Insert or update a message            |
| PATCH  | `/api/messages/:id/status`       | Update status of a message            |
| DELETE | `/api/messages/:id`              | Delete a message                      |

---

## 🛠️ Tech Stack
- **Runtime:** Node.js
- **Framework:** Express.js
- **Database:** MongoDB Atlas
- **Real-time:** Socket.IO
- **Hosting:** Render

---

## 📂 Folder Structure
```
whatsapp-backend/
  ├── models/          # Mongoose schemas
  ├── routes/          # API route handlers
  ├── server.js        # Main server entry
  ├── processPayloads.js # Script to process sample JSON payloads
  └── package.json
```

---

## 📦 Installation & Local Run
```bash
# Clone repo
git clone https://github.com/Manu1806-n/whatsapp-backend.git
cd whatsapp-backend

# Install dependencies
npm install

# Set environment variables in .env
MONGO_URI=your-mongo-uri
CORS_ORIGIN=http://localhost:3000
PLATFORM_WA_ID=919999999999

# Start server
node server.js
```

---

## 📜 License
This project is for educational/demonstration purposes only. No real WhatsApp messages are sent.
