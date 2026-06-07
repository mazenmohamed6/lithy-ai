const localtunnel = require("localtunnel");
const fs = require("fs");
const path = require("path");

const urlFile = path.join(__dirname, ".tunnel-url");

async function startTunnel() {
  try {
    const tunnel = await localtunnel({ port: 3001 });
    const url = tunnel.url;
    fs.writeFileSync(urlFile, url);
    console.log("TUNNEL_URL=" + url);
    tunnel.on("close", () => {
      console.log("Tunnel closed, reconnecting...");
      fs.unlinkSync(urlFile);
      startTunnel();
    });
    tunnel.on("error", (e) => console.error("Tunnel error:", e.message));
  } catch (e) {
    console.error("Tunnel creation failed:", e.message);
    process.exit(1);
  }
}

startTunnel();
