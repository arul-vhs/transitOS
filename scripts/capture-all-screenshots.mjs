import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import jwt from "jsonwebtoken";

const CHROME_PATH = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const OUTPUT_DIR = path.resolve("public/presentation");
const PORT = 9222;

if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

const token = jwt.sign(
  {
    userId: "59c3c165-8fcd-4490-b126-c286ffa64700",
    tenantId: "6fcb73df-750e-4fe5-b0cb-456b119dcd64",
    role: "ORGANIZATION_ADMIN",
    email: "admin@salemtransport.demo",
    name: "System Admin",
  },
  "super-secret-session-key-change-in-production",
  { expiresIn: "24h" }
);

async function startChrome() {
  const chromeProcess = spawn(CHROME_PATH, [
    "--headless=new",
    `--remote-debugging-port=${PORT}`,
    "--disable-gpu",
    "--no-first-run",
    "--no-default-browser-check",
    "--user-data-dir=/tmp/chrome-presentation-profile",
  ]);

  // Wait for Chrome CDP port to become active
  for (let i = 0; i < 30; i++) {
    try {
      const res = await fetch(`http://127.0.0.1:${PORT}/json/version`);
      if (res.ok) {
        const json = await res.json();
        return { chromeProcess, wsUrl: json.webSocketDebuggerUrl };
      }
    } catch {}
    await new Promise((r) => setTimeout(r, 200));
  }
  throw new Error("Could not connect to Chrome CDP");
}

class CDPClient {
  constructor(wsUrl) {
    this.wsUrl = wsUrl;
    this.ws = null;
    this.nextId = 1;
    this.callbacks = new Map();
  }

  async connect() {
    this.ws = new WebSocket(this.wsUrl);
    await new Promise((resolve, reject) => {
      this.ws.onopen = resolve;
      this.ws.onerror = reject;
    });

    this.ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      if (msg.id && this.callbacks.has(msg.id)) {
        const { resolve, reject } = this.callbacks.get(msg.id);
        this.callbacks.delete(msg.id);
        if (msg.error) reject(new Error(msg.error.message));
        else resolve(msg.result);
      }
    };
  }

  send(method, params = {}) {
    return new Promise((resolve, reject) => {
      const id = this.nextId++;
      this.callbacks.set(id, { resolve, reject });
      this.ws.send(JSON.stringify({ id, method, params }));
    });
  }

  close() {
    if (this.ws) this.ws.close();
  }
}

const targets = [
  { name: "01-landing.png", url: "http://localhost:8080/landing", wait: 2000 },
  { name: "02-dashboard.png", url: "http://localhost:8080/", wait: 2500 },
  { name: "03-route-network.png", url: "http://localhost:8080/network/routes", wait: 3500 },
  { name: "04-corridor-planner.png", url: "http://localhost:8080/network/planner", wait: 3000 },
  { name: "05-duty-optimizer.png", url: "http://localhost:8080/scheduling/optimizer", wait: 3500 },
  { name: "06-simulation.png", url: "http://localhost:8080/simulation", wait: 3500 },
  { name: "07-today-operations.png", url: "http://localhost:8080/operations/today", wait: 2500 },
  { name: "08-crew-availability.png", url: "http://localhost:8080/crew/availability", wait: 2500 },
  { name: "09-plan-vs-actual.png", url: "http://localhost:8080/analytics/plan-vs-actual", wait: 2500 },
];

async function main() {
  console.log("Launching headless Chrome for screenshot capture...");
  const { chromeProcess, wsUrl } = await startChrome();
  console.log("Connected to Chrome via CDP:", wsUrl);

  const browserClient = new CDPClient(wsUrl);
  await browserClient.connect();

  // Create a new target page
  const { targetId } = await browserClient.send("Target.createTarget", {
    url: "about:blank",
  });

  const pageRes = await fetch(`http://127.0.0.1:${PORT}/json`);
  const pages = await pageRes.json();
  const pageTarget = pages.find((p) => p.id === targetId);

  const pageClient = new CDPClient(pageTarget.webSocketDebuggerUrl);
  await pageClient.connect();

  await pageClient.send("Page.enable");
  await pageClient.send("Network.enable");

  // Set device viewport to 1440x900 at 2x scale factor for crystal-clear images
  await pageClient.send("Emulation.setDeviceMetricsOverride", {
    width: 1440,
    height: 900,
    deviceScaleFactor: 2,
    mobile: false,
  });

  // Set session cookie
  await pageClient.send("Network.setCookie", {
    name: "transitOS_session",
    value: token,
    domain: "localhost",
    path: "/",
    httpOnly: true,
  });

  for (const item of targets) {
    console.log(`Navigating to ${item.url}...`);
    await pageClient.send("Page.navigate", { url: item.url });
    await new Promise((r) => setTimeout(r, item.wait));

    const { data } = await pageClient.send("Page.captureScreenshot", {
      format: "png",
      quality: 100,
    });

    const filePath = path.join(OUTPUT_DIR, item.name);
    fs.writeFileSync(filePath, Buffer.from(data, "base64"));
    console.log(`Saved screenshot: ${filePath} (${Math.round(data.length / 1024)} KB)`);
  }

  pageClient.close();
  browserClient.close();
  chromeProcess.kill();
  console.log("All screenshots captured successfully!");
}

main().catch((err) => {
  console.error("Error capturing screenshots:", err);
  process.exit(1);
});
