const Gun = require("gun");
require("gun/sea");
require("gun/lib/webrtc");

const http = require("http");
const port = 8765;

const server = http.createServer();
server.listen(port, () => {
  console.log("GUN peer running on http://localhost:" + port + "/gun");
});


Gun({ web: server });
