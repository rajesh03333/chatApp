const Gun = require("gun");
require("gun/sea");
require("gun/lib/webrtc");

const http = require("http");

const port = Number(process.env.GUN_SERVER_2_PORT || 8766);
const server1Url = process.env.GUN_SERVER_1_URL || "http://localhost:8765/gun";
const storage = process.env.GUN_SERVER_2_STORAGE || "radata2";

if (!Number.isInteger(port) || port < 1 || port > 65535) {
  throw new Error(`Invalid GUN_SERVER_2_PORT: ${process.env.GUN_SERVER_2_PORT}`);
}

const server = http.createServer();
const gun = Gun({
  web: server,
  file: storage,
  peers: [server1Url],
});

gun.on("hi", (peer) => {
  console.log("Server 2 connected to Gun peer:", peer.url || server1Url);
});

gun.on("bye", (peer) => {
  console.warn("Server 2 disconnected from Gun peer:", peer.url || server1Url);
});

gun.on("put", (data) => {
  console.log("GUN Server 2 PUT:", JSON.stringify(data));
});

server.on("error", (error) => {
  console.error("Gun Server 2 failed:", error.message);
  process.exitCode = 1;
});

server.listen(port, () => {
  console.log(`Gun Server 2 running on http://localhost:${port}/gun`);
  console.log(`Gun Server 2 storage: ${storage}`);
  console.log(`Gun Server 2 peer target: ${server1Url}`);
  console.log("Gun peer synchronization enabled through the Gun peer network");
});