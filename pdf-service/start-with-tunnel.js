// Starts PDF service + localtunnel together, prints the URL
const { fork } = require("child_process");
const path = require("path");
const localtunnel = require("localtunnel");
const http = require("http");

const PORT = parseInt(process.env.PORT, 10) || 3001;

// Fork the server in a child process
const serverPath = path.join(__dirname, "server.js");
const serverProcess = fork(serverPath, [], {
  env: { ...process.env, PORT: String(PORT) },
  stdio: "pipe",
});

serverProcess.stdout.on("data", (d) => process.stdout.write(d));
serverProcess.stderr.on("data", (d) => process.stderr.write(d));

// Wait for server to start, then create tunnel
function waitForServer(retries) {
  return new Promise((resolve, reject) => {
    function check(i) {
      const req = http.get(`http://localhost:${PORT}/health`, (res) => {
        if (res.statusCode === 200) return resolve();
        if (i >= retries) return reject(new Error("Server not ready"));
        setTimeout(() => check(i + 1), 1000);
      });
      req.on("error", () => {
        if (i >= retries) return reject(new Error("Server not ready"));
        setTimeout(() => check(i + 1), 1000);
      });
      req.end();
    }
    check(0);
  });
}

async function main() {
  console.log("Waiting for PDF service to start...");
  await waitForServer(15);
  console.log("PDF service is ready on http://localhost:" + PORT);

  console.log("Creating public tunnel...");
  const tunnel = await localtunnel({ port: PORT });
  const url = tunnel.url;

  console.log("");
  console.log("========================================");
  console.log("  PDF SERVICE IS RUNNING");
  console.log("  Tunnel URL: " + url);
  console.log("========================================");
  console.log("");
  console.log("Set this env var on Vercel:");
  console.log("  PDF_SERVICE_URL=" + url);
  console.log("");

  tunnel.on("close", () => {
    console.log("Tunnel closed");
    process.exit(1);
  });

  // Graceful shutdown
  process.on("SIGINT", () => {
    console.log("Shutting down...");
    tunnel.close();
    serverProcess.kill();
    process.exit(0);
  });

  process.on("SIGTERM", () => {
    tunnel.close();
    serverProcess.kill();
    process.exit(0);
  });
}

main().catch((err) => {
  console.error("Failed:", err.message);
  serverProcess.kill();
  process.exit(1);
});
