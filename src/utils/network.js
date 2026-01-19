// src/utils/network.js

//Provides all external IPv4 IPs to web server
const os = require("os");

function getLocalIPs() {
  const nets = os.networkInterfaces();
  const results = [];

  for (const name of Object.keys(nets)) {
    for (const net of nets[name] || []) {
      if (net.family === "IPv4" && !net.internal) results.push(net.address);
    }
  }

  return results;
}

module.exports = { getLocalIPs };
