// Runs cloudflared, captures the tunnel URL from stdout, writes it to .tunnel-url
const { spawn } = require("child_process");
const fs = require("fs");
const path = require("path");

const cf = process.platform === "win32" ? "cloudflared.exe" : "cloudflared";
const logFile = path.join(__dirname, ".tunnel-url");

const proc = spawn(cf, ["tunnel", "--url", "http://localhost:3001", "--no-autoupdate"], {
  stdio: ["ignore", "pipe", "pipe"],
  shell: true,
});

let output = "";
proc.stdout.on("data", (d) => {
  const text = d.toString();
  output += text;
  process.stdout.write(text);
  const match = text.match(/https:\/\/[a-z-]+\.trycloudflare\.com/);
  if (match) {
    const url = match[0];
    fs.writeFileSync(logFile, url);
    console.log("\n=== TUNNEL URL: " + url + " ===");
    console.log("(Set this as PDF_SERVICE_URL on Vercel)");
  }
});

proc.stderr.on("data", (d) => {
  const text = d.toString();
  output += text;
  process.stderr.write(text);
  const match = text.match(/https:\/\/[a-z-]+\.trycloudflare\.com/);
  if (match) {
    const url = match[0];
    fs.writeFileSync(logFile, url);
    console.log("\n=== TUNNEL URL: " + url + " ===");
    console.log("(Set this as PDF_SERVICE_URL on Vercel)");
  }
});

proc.on("close", (code) => {
  console.log("\ncloudflared exited with code " + code);
});
