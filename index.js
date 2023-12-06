const fs = require("fs");
const https = require("https");
const http = require("http");
const express = require("express");
const jwt = require("jsonwebtoken");
const multer = require("multer");
const xlsx = require("xlsx");
const pool = require("./src/db");
const cors = require("cors");
const privateKey = fs.readFileSync("./private.key", "utf8");
const bodyParser = require("body-parser");
const certificate = fs.readFileSync("./server.crt", "utf8");
const credentials = {
  key: privateKey,
  cert: certificate,
};

const app = express();
const historyStamp = require("./src/callStamp");

app.use(
  cors({
    // origin: "https://localhost:2063", // Remove the trailing slash
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
    credentials: true,
    optionsSuccessStatus: 204,
  })
);
app.use(bodyParser.json());

app.post("/linecallstamp", historyStamp.lineCallStamp);
app.post("/callstamp", historyStamp.callStamp);
app.post("/messengerstamp", historyStamp.messengerStamp);

// const httpsServer = https.createServer(credentials, app);

// httpsServer.listen(2083, () => {
//   console.log("Server is running on port 2083 (HTTPS)");
// });
const httpServer = http.createServer(app);

httpServer.listen(2083, () => {
  console.log("Server is running on port 2083 (HTTP)");
});
