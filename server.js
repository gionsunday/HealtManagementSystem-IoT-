const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
require("dotenv").config();
const nodemailer = require("nodemailer");

const app = express();
const path = require('path')
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use("/", express.static(path.join(__dirname, "public")));
app.use(express.json());

// Store the latest data in memory
let latestData = "No data yet";

// Route to receive data from ESP32
app.post("/update", (req, res) => {
  const { value } = req.body;
  if (!value) {
    return res.status(400).send("Missing value");
  }

  latestData = value;
  console.log("Received from ESP32:", value);
  res.send("Data received: " + value);
});

// Route to view data
app.get("/", (req, res) => {
  var transporter = nodemailer.createTransport({
    service: process.env.E_NEWSERVER,
    // port: 587,
    // secure: false, // true for port 465, false for other ports
    auth: {
      user: process.env.NEW_E,
      pass: process.env.NEW_P,
    },
  });

  const EmailMessage = {
    from: process.env.NEW_E,
    to: email,
    subject: `You Subscribed!`,
    attachments: [
      {
        filename: "logo-blue.png",
        path: __dirname + "/logo-blue.png",
        cid: "save-logo-blue.png",
      },
    ],
    html: `
     <body style="background-color: rgba(253, 222, 232, 0.048); width: 100%;" >

    <div  style="  height: 100%; padding: .5em .5em 4em .5em; border-radius:10px;
    margin-top: 70px !important;
    background-color: #d63384; width: 100%; margin: auto; position: relative; text-align:left; 
    font-size: 1.5em; word-wrap: break-word;">

    <div style="text-align:center; ">
    <img style="width: 150px;" src="cid:save-logo-blue.png" />
    </div>
        <h4 style="text-align: center; color: rgb(255, 255, 255); font-size: 2em;  ">Health Status</h4>
        <p style="
             border-radius: 10px; padding: 10px;  box-shadow: 2px 2px 4px rgba(0, 0, 0, 0.123); width: 90%; 
             margin: auto; margin-bottom: 4px; background-color: white;">Hi!
            <span style="color: rgb(55, 33, 248); font-weight: 900;" >
            </span> 
            <br>
            <h1>ESP32 Live Data</h1><p>Latest Value: ${latestData}</p>
            <br>
            
            <br
            </p>
     
    </div>
</body>
      
    `,
  };

  transporter.sendMail(EmailMessage, function (error, body) {
    if (error) {
      return res.json({ error: error });
    }
    // res.send({contact})
    res.json({
      message: "Email Sent!",
      update: `<h1>ESP32 Live Data</h1><p>Latest Value: ${latestData}</p>`,
    });
  });
});

app.post("/temp", (req, res) => {
    latestTemp = req.body.temperature;
    console.log(`Temperature received: ${latestTemp}°C`);

    // Example: Send email if temp > 30°C
    if (latestTemp > 30) {
        sendAlertEmail(latestTemp);
    }

    res.json({ message: "Temperature received" });
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
