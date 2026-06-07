// One script: starts Express server + localtunnel, stays alive
const express = require("express");
const { chromium } = require("playwright");
const localtunnel = require("localtunnel");
const cors = require("cors");

const PORT = parseInt(process.env.PORT, 10) || 3001;
const app = express();
app.use(cors());
app.use(express.json({ limit: "1mb" }));

app.get("/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.post("/render-pdf", async (req, res) => {
  const { url } = req.body;
  if (!url) return res.status(400).json({ error: 'Missing "url"' });

  const id = `pdf_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
  console.log(`[${id}] Render PDF: ${url}`);

  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage({ viewport: { width: 800, height: 1100 } });
    await page.goto(url, { waitUntil: "networkidle", timeout: 30000 });
    await page.waitForSelector(".res-root", { timeout: 15000 });
    await page.evaluate(() => document.fonts.ready);
    const pdf = await page.pdf({
      format: "Letter",
      printBackground: true,
      margin: { top: "0.4in", bottom: "0.4in", left: "0.4in", right: "0.4in" },
    });
    console.log(`[${id}] PDF generated (${pdf.length} bytes)`);
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", 'attachment; filename="resume.pdf"');
    res.send(pdf);
  } catch (err) {
    console.error(`[${id}] Error: ${err.message}`);
    res.status(500).json({ error: "PDF generation failed", message: err.message });
  } finally {
    await browser.close();
  }
});

async function main() {
  // Start Express
  await new Promise((resolve) => app.listen(PORT, resolve));
  console.log(`PDF Service on http://localhost:${PORT}`);

  // Start localtunnel
  const tunnel = await localtunnel({ port: PORT });
  console.log(`\n  Tunnel URL: ${tunnel.url}\n`);
  require("fs").writeFileSync(__dirname + "/.tunnel-url", tunnel.url);
  tunnel.on("close", () => { console.log("Tunnel closed"); process.exit(1); });

  // Graceful shutdown
  process.on("SIGINT", () => { tunnel.close(); process.exit(0); });
  process.on("SIGTERM", () => { tunnel.close(); process.exit(0); });
}

main().catch((e) => { console.error("Fatal:", e); process.exit(1); });
