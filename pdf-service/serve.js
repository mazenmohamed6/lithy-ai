const express = require("express");
const { chromium } = require("playwright");
const localtunnel = require("localtunnel");
const fs = require("fs");
const path = require("path");

const PORT = 3001;
const urlFile = path.join(__dirname, ".tunnel-url");
const app = express();

app.use(express.json({ limit: "10mb" }));

app.get("/health", (req, res) => res.json({ status: "ok", timestamp: new Date().toISOString() }));

app.post("/render-pdf", async (req, res) => {
  const { url } = req.body;
  console.log("[render-pdf] url=" + url);
  if (!url) {
    console.log("[render-pdf] missing url");
    return res.status(400).json({ error: "url is required" });
  }
  let browser;
  try {
    console.log("[render-pdf] launching browser...");
    browser = await chromium.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"],
    });
    const context = await browser.newContext({ viewport: { width: 1200, height: 800 } });
    const page = await context.newPage();
    console.log("[render-pdf] navigating to " + url);
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 25000 });
    console.log("[render-pdf] waiting for .res-root...");
    await page.waitForSelector(".res-root", { timeout: 10000 }).catch(() => console.log("[render-pdf] .res-root not found, continuing"));
    await page.evaluate(() => document.fonts.ready).catch(() => {});
    console.log("[render-pdf] generating PDF...");
    const pdf = await page.pdf({ format: "A4", printBackground: true, margin: { top: 0, right: 0, bottom: 0, left: 0 } });
    console.log("[render-pdf] PDF generated: " + pdf.length + " bytes");
    res.set({ "Content-Type": "application/pdf", "Content-Disposition": 'attachment; filename="resume.pdf"' });
    res.send(Buffer.from(pdf));
  } catch (err) {
    console.log("[render-pdf] error: " + (err && err.message ? err.message : String(err)));
    res.status(500).json({ error: err && err.message ? err.message : String(err) });
  } finally {
    if (browser) try { await browser.close(); } catch {}
  }
});

// Start HTTP server
app.listen(PORT, () => console.log("Server on :" + PORT));

// Start localtunnel with auto-reconnect
let tunnel = null;
let tunnelUrl = null;

async function startTunnel() {
  if (tunnel) { try { tunnel.close(); } catch {} tunnel = null; }
  try {
    tunnel = await localtunnel({ port: PORT });
    tunnelUrl = tunnel.url;
    fs.writeFileSync(urlFile, tunnelUrl);
    console.log("TUNNEL_URL=" + tunnelUrl);
    tunnel.on("close", () => {
      console.log("Tunnel closed, restarting...");
      tunnelUrl = null;
      if (fs.existsSync(urlFile)) fs.unlinkSync(urlFile);
      setTimeout(startTunnel, 2000);
    });
    tunnel.on("error", (e) => console.log("Tunnel error: " + e.message));
  } catch (e) {
    console.log("Tunnel failed, retrying in 5s: " + e.message);
    setTimeout(startTunnel, 5000);
  }
}

// Monitor tunnel health every 30s
setInterval(() => {
  if (!tunnel) return;
  fetch(tunnelUrl + "/health").catch(() => {
    console.log("Health check failed, restarting tunnel...");
    startTunnel();
  });
}, 30000);

startTunnel();

process.on("uncaughtException", (e) => console.log("UNCAUGHT: " + (e && e.message ? e.message : e)));
process.on("unhandledRejection", (e) => console.log("UNHANDLED: " + (e && e.message ? e.message : e)));

console.log("serve.js started");
