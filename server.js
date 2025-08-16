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

let lastAlertState = null; // "low", "high", "normal", or null
let lastEmailTime = 0;
const ALERT_COOLDOWN = 5 * 60 * 1000; // 5 minutes

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
  if (!latestData || !latestData.value) {
    return res.status(503).json({
      status: "offline",
      message: "System offline: No temperature data available"
    });
  }

  const temp = latestData.value;

  // Define abnormal thresholds
  const lowThreshold = 35.0;
  const highThreshold = 38.0;

   // Handle abnormal case
  if (temp < lowThreshold || temp > highThreshold) {
    if (!alertActive) {
      sendAlertEmail(temp);
      alertActive = true; // Prevent repeated alerts
    }
  } else {
    // Handle recovery case
    if (alertActive) {
      sendRecoveryEmail(temp);
      alertActive = false; // Reset system after recovery
    }
  }

  res.json({
    status: "online",
    temperature: temp,
    unit: "°C"
  });
});


function createTransporter() {
  return nodemailer.createTransport({
    service: process.env.E_NEWSERVER,
    auth: {
      user: process.env.NEW_E,
      pass: process.env.NEW_P
    }
  });
}

function sendAlertEmail(temp) {
  const transporter = createTransporter();

  let recommendation = "";
  if (temp < 35.0) {
    recommendation = "Temperature is too low. Risk of hypothermia. Seek warmth and medical attention if persistent.";
  } else if (temp > 38.0) {
    recommendation = "Temperature is too high. Possible fever. Stay hydrated and consult a doctor if it persists.";
  }

  const EmailMessage = {
    from: process.env.NEW_E,
    to: process.env.ALERT_EMAIL || "recipient@example.com",
    subject: `⚠️ Temperature Alert: ${temp}°C`,
    html: `
      <h3>⚠️ Temperature Alert!</h3>
      <p>The current measured temperature is <strong>${temp}°C</strong>.</p>
      <p><strong>Recommendation:</strong> ${recommendation}</p>
      <p><a href="https://healthmanagementsystem-iot.onrender.com" style="color: white; background: #007bff; padding: 10px 15px; text-decoration: none; border-radius: 6px;">Visit Web App</a></p>
    `
  };

  transporter.sendMail(EmailMessage, (error, info) => {
    if (error) {
      return console.error("Email error:", error);
    }
    console.log("Alert email sent:", info.response);
  });
}

function sendRecoveryEmail(temp) {
  const transporter = createTransporter();

  const EmailMessage = {
    from: process.env.NEW_E,
    to: process.env.ALERT_EMAIL || "recipient@example.com",
    subject: `✅ Temperature Back to Normal: ${temp}°C`,
    html: `
      <h3>✅ Recovery Notice</h3>
      <p>The patient's temperature has returned to normal: <strong>${temp}°C</strong>.</p>
      <p>No further action is required, but continue monitoring.</p>
      <p><a href="https://healthmanagementsystem-iot.onrender.com" style="color: white; background: #28a745; padding: 10px 15px; text-decoration: none; border-radius: 6px;">Visit Web App</a></p>
    `
  };

  transporter.sendMail(EmailMessage, (error, info) => {
    if (error) {
      return console.error("Email error:", error);
    }
    console.log("Recovery email sent:", info.response);
  });
}

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
