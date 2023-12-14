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
const getCustomer = require("./src/getCustomer");
const caseStamp = require("./src/caseStamp")
const contact = require("./src/contact")
// const createContact = require('./src/createContact')
const credentials = {
  key: `
-----BEGIN PRIVATE KEY-----
MIICdgIBADANBgkqhkiG9w0BAQEFAASCAmAwggJcAgEAAoGBAM5+2AtR0sEOsl9/
3bzRByicsVECRDVVnQU6jRbH2ftTxM+ETFwkzGQnAYCY0Gq/pux0cF3bW/xed8Pd
fO0AMzoMHtSGpBVN2jf4cvqeYgPWJH8Q599qX0NaxY5VGHnlrMiTn2PZG83e3AeT
UHoMSEjM0g016FsuK5aqx3Cz3kLJAgMBAAECgYAi4F+jAc3j15Se9py/8FoSLOzx
7r0QeQZNRMdhqp2RimN6XTD8eyaeX8wsKSNCdF5AH6Z+47bUmCwIQ9d+vALqpCbw
uCl73lpaxJgjs/GLXs5UvkW8vHrADuZzfPEMik/7mX8tM0JJKfVYBXM+xn2Uro6y
GgRtGiGVwjFc76pdgQJBAPO8NAMPlyANg2mxrWQg24iUVK4mOPFkRwtHYTRONvpe
zmw4KQ9v9pl8l3FpiZESCEFvbDitVEVEBZgQ9+DK+xECQQDY4utIh8uLcDcLh+pD
LRNLgv5EcrckgcjEXkY2Zuq/iPRoPDgeNveTHcGF/g/TTALiCS3R8k+WTMCytQMO
zpw5AkAYxNN0TC1LcJQeNZQtTLmCk7BXUkMPJOWjW8mhCyHDJ8dKcBqcGwCwcFzj
hZoZR//Wxn/08ohR0avP3EmUaoxBAkEApVRlksahbMu/yjRzaX3k5X0XosnnvhaJ
GtfaogHWFOermAG/rZitJSJbsW64VZPt5qyklxQlgydDBXdiu1jYUQJAPe8jbk4H
tVHMs+4B0ZRZhuwxyWLYkxpMqcy1TsGAPCiJQ0Bdi3jRRevbgsmT73JM1kjtWpPx
UO8us1fm14iLxA==
-----END PRIVATE KEY-----
`,
  cert: `
-----BEGIN CERTIFICATE-----
MIIC8jCCAlugAwIBAgIJAI80RSPizImXMA0GCSqGSIb3DQEBCwUAMIGRMQswCQYD
VQQGEwJUSDEQMA4GA1UECAwHQmFuZ2tvazEOMAwGA1UEBwwFU2lsb20xDDAKBgNV
BAoMA3NjbTENMAsGA1UECwwEc2NtYzENMAsGA1UEAwwEc2NtYzE0MDIGCSqGSIb3
DQEJARYlcGh1dHRoaXBvbmcuZGlsQHNjbXRlY2hub2xvZ2llcy5jby50aDAeFw0y
MzExMTMwNDA2MDlaFw0yNDExMTIwNDA2MDlaMIGRMQswCQYDVQQGEwJUSDEQMA4G
A1UECAwHQmFuZ2tvazEOMAwGA1UEBwwFU2lsb20xDDAKBgNVBAoMA3NjbTENMAsG
A1UECwwEc2NtYzENMAsGA1UEAwwEc2NtYzE0MDIGCSqGSIb3DQEJARYlcGh1dHRo
aXBvbmcuZGlsQHNjbXRlY2hub2xvZ2llcy5jby50aDCBnzANBgkqhkiG9w0BAQEF
AAOBjQAwgYkCgYEAzn7YC1HSwQ6yX3/dvNEHKJyxUQJENVWdBTqNFsfZ+1PEz4RM
XCTMZCcBgJjQar+m7HRwXdtb/F53w9187QAzOgwe1IakFU3aN/hy+p5iA9YkfxDn
32pfQ1rFjlUYeeWsyJOfY9kbzd7cB5NQegxISMzSDTXoWy4rlqrHcLPeQskCAwEA
AaNQME4wHQYDVR0OBBYEFPh2byeHsES/7kRLma03Z4Z/3yckMB8GA1UdIwQYMBaA
FPh2byeHsES/7kRLma03Z4Z/3yckMAwGA1UdEwQFMAMBAf8wDQYJKoZIhvcNAQEL
BQADgYEAYYFGzxwRa+tyi4WqhLpYdnLG0xsIaZj2aPJGQOqZcR4Jlgzd+PEEc3vT
oHPXwlKrYvNlSZ2bF97iEwbik/SZ5mTnUi8F1WsvAEbU/JGg6hS8qntmTAH3S5ol
jLpKFZWdgTZL35FLois9QxW+8g1VRtUOfeVEI/KEXorMcBeTASE=
-----END CERTIFICATE-----
`,
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
app.post("/getcustomer", getCustomer.getCustomer);
app.post("/createcustomer", getCustomer.createCustomer);
app.post("/createsession", caseStamp.createSession)
app.post("/stampendchatsession", caseStamp.updateSession)
app.post("/insertcontacthistory",caseStamp.selectAndInsertContactHistory)
app.post("/updatecontact",contact.updateContact)
app.post("/getcontact",contact.getContact)
app.post("/createcontact",contact.createContact)


const httpsServer = https.createServer(credentials, app);

httpsServer.listen(2096, () => {
  console.log("Server is running on port 2096 (HTTPS)");
});
// const httpServer = http.createServer(app);

// httpServer.listen(2083, () => {
//   console.log("Server is running on port 2083 (HTTP)");
// });
