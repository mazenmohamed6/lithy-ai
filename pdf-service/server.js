const express = require("express");
const { chromium } = require("playwright");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json({ limit: "1mb" }));

app.get("/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.post("/render-pdf", async (req, res) => {
  const { url } = req.body;
  if (!url) {
    return res.status(400).json({ error: 'Missing "url" in request body' });
  }

  const id = `pdf_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
  console.log(`[${id}] Render PDF: ${url}`);

  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage({ viewport: { width: 800, height: 1100 } });

    await page.goto(url, { waitUntil: "networkidle", timeout: 30000 });
    console.log(`[${id}] navigated OK`);

    await page.waitForSelector(".res-root", { timeout: 15000 });
    console.log(`[${id}] .res-root found`);

    await page.evaluate(() => document.fonts.ready);
    console.log(`[${id}] fonts ready`);

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

app.listen(PORT, () => {
  console.log(`PDF Service running on port ${PORT}`);
});
