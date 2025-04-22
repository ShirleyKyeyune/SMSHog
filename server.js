// server.js
const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const fs = require("fs");

const app = express();
const PORT = 8188;
const MESSAGES_FILE = "./messages.json";

// Load existing messages
let messages = [];
if (fs.existsSync(MESSAGES_FILE)) {
  messages = JSON.parse(fs.readFileSync(MESSAGES_FILE));
}

app.use(cors());
app.use(bodyParser.json());
app.use(express.static("public"));

// API to receive SMS
app.post("/api/sms", (req, res) => {
  const { phone, message } = req.body;
  if (!phone || !message) {
    return res.status(400).json({ error: "Missing phone or message" });
  }

  const sms = { phone, message, timestamp: new Date() };
  messages.unshift(sms); // add to top
  fs.writeFileSync(MESSAGES_FILE, JSON.stringify(messages, null, 2));

  res.status(200).json({ status: "received", sms });
});

// API to fetch all messages
app.get("/api/sms", (req, res) => {
  res.json(messages);
});

// Clear all messages
app.delete("/api/sms", (req, res) => {
  try {
    // Clear in memory
    messages.length = 0;

    // Overwrite file
    fs.writeFileSync(MESSAGES_FILE, JSON.stringify([], null, 2));

    console.log("✅ Inbox successfully cleared.");
    res.status(200).json({ status: "cleared" });
  } catch (error) {
    console.error("❌ Failed to clear messages:", error);
    res.status(500).json({ error: "Failed to clear inbox." });
  }
});

// Export as CSV
app.get("/api/sms.csv", (req, res) => {
  const csv = [
    ["Phone", "Message", "Timestamp"],
    ...messages.map((m) => [
      m.phone,
      m.message.replace(/"/g, '""'),
      new Date(m.timestamp).toLocaleString(),
    ]),
  ]
    .map((row) => row.map((field) => `"${field}"`).join(","))
    .join("\n");

  res.setHeader("Content-Type", "text/csv");
  res.setHeader("Content-Disposition", "attachment; filename=sms-messages.csv");
  res.send(csv);
});

app.listen(PORT, () => {
  console.log(`📬 SMSHog running on http://localhost:${PORT}`);
});
