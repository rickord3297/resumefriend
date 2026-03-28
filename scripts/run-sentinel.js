/**
 * Run Sentinel by calling the app's API (app must be running, or use a deployed URL).
 * Optional: SENTINEL_URL, SENTINEL_AVAILABILITY_JSON or SENTINEL_AVAILABILITY_FILE.
 *
 * Usage:
 *   npm run dev   # in one terminal
 *   SENTINEL_URL=http://localhost:3000 npm run sentinel
 */

const path = require("path");
const fs = require("fs");
const http = require("http");
const https = require("https");

const baseUrl = process.env.SENTINEL_URL || "http://localhost:3000";

function loadEnv() {
  const envPath = path.join(process.cwd(), ".env");
  if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, "utf-8");
    content.split("\n").forEach((line) => {
      const m = line.match(/^([^#=]+)=(.*)$/);
      if (m) process.env[m[1].trim()] = m[2].trim().replace(/^["']|["']$/g, "");
    });
  }
}

function getBody() {
  let calendarAvailability;
  if (process.env.SENTINEL_AVAILABILITY_FILE && fs.existsSync(process.env.SENTINEL_AVAILABILITY_FILE)) {
    calendarAvailability = JSON.parse(fs.readFileSync(process.env.SENTINEL_AVAILABILITY_FILE, "utf-8"));
  } else if (process.env.SENTINEL_AVAILABILITY_JSON) {
    calendarAvailability = JSON.parse(process.env.SENTINEL_AVAILABILITY_JSON);
  }
  return JSON.stringify(calendarAvailability ? { calendarAvailability } : {});
}

function post(url, body) {
  const u = new URL(url);
  const client = u.protocol === "https:" ? https : http;
  return new Promise((resolve, reject) => {
    const req = client.request(
      url,
      {
        method: "POST",
        headers: { "Content-Type": "application/json", "Content-Length": Buffer.byteLength(body) },
      },
      (res) => {
        const chunks = [];
        res.on("data", (c) => chunks.push(c));
        res.on("end", () => resolve(JSON.parse(Buffer.concat(chunks).toString())));
      }
    );
    req.on("error", reject);
    req.write(body);
    req.end();
  });
}

loadEnv();
const body = getBody();
post(`${baseUrl}/api/sentinel/run`, body)
  .then((result) => {
    console.log(JSON.stringify(result, null, 2));
    if (result.error) process.exit(1);
  })
  .catch((err) => {
    console.error(err.message || err);
    process.exit(1);
  });
