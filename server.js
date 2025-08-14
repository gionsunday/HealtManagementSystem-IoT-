const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
require("dotenv").config();
const nodemailer = require("nodemailer");
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use("/", express.static(path.join(__dirname, "public")));

// Store latest sensor data
let latestData = {
  value: null,
  unit: "°C",
  timestamp: null
};

// Route to receive ESP32 data (generic)
app.post("/update", (req, res) => {
  const { value, unit } = req.body;
  if (value == null) {
    return res.status(400).send("Missing value");
  }

  latestData.value = value;
  latestData.unit = unit || "°C";
  latestData.timestamp = new Date().toISOString();

  console.log("Received from ESP32:", latestData);
  res.json({ message: "Data received", data: latestData });
});

// Route specifically for temperature from ESP32
app.post("/temp", (req, res) => {
  const { temperature } = req.body;
  if (temperature == null) {
    return res.status(400).send("Missing temperature");
  }

  latestData.value = temperature;
  latestData.unit = "°C";
  latestData.timestamp = new Date().toISOString();

  console.log(`Temperature received: ${temperature}°C`);

  // Optional: send alert email if temp > 30
  if (temperature > 30) {
    sendAlertEmail(temperature);
  }

  res.json({ message: "Temperature received", data: latestData });
});

// Route to let frontend fetch the latest data
app.get("/temp", (req, res) => {
  if (!latestData.value) {
    return res.status(404).json({ error: "No data yet" });
  }
  res.json(latestData);
});

function sendAlertEmail(temp) {
  const transporter = nodemailer.createTransport({
    service: process.env.E_NEWSERVER,
    auth: {
      user: process.env.NEW_E,
      pass: process.env.NEW_P
    }
  });

  const EmailMessage = {
    from: process.env.NEW_E,
    to: process.env.ALERT_EMAIL || "recipient@example.com",
    subject: `Temperature Alert: ${temp}°C`,
    html: `<p>Alert! The temperature is ${temp}°C.</p>`
  };

  transporter.sendMail(EmailMessage, (error, info) => {
    if (error) {
      return console.error("Email error:", error);
    }
    console.log("Alert email sent:", info.response);
  });
}

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
