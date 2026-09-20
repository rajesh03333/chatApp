const Gun = require("gun");
require("gun/sea");
require("gun/lib/webrtc");

const http = require("http");
const port = Number(process.env.GUN_SERVER_1_PORT || 8765);
const server2Url = process.env.GUN_SERVER_2_URL || "http://localhost:8766/gun";

const server = http.createServer();
server.listen(port, () => {
  console.log("GUN peer running on http://localhost:" + port + "/gun");
});

Gun.on("put", data => {
  console.log("📦 GUN PUT:", JSON.stringify(data, null, 2));
});



// Server 1 keeps its existing persistent graph in radata. Server 2 has its
// own storage and joins this same Gun graph through native peer sync.
const gun = Gun({ web: server, file: "radata", peers: [server2Url] });

gun.on("hi", (peer) => {
  console.log("Server 1 connected to Gun peer:", peer.url || server2Url);
});

gun.on("bye", (peer) => {
  console.warn("Server 1 disconnected from Gun peer:", peer.url || server2Url);
});
