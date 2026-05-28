const os = require('os');

const mode = process.argv[2] || 'dev';
const appPort = mode === 'start' || mode === 'backend' ? 3000 : 5173;
const apiPort = 3000;

function getNetworkUrls(port) {
  const interfaces = os.networkInterfaces();
  const urls = [];

  for (const entries of Object.values(interfaces)) {
    for (const entry of entries || []) {
      if (entry.family !== 'IPv4' || entry.internal) continue;
      urls.push(`http://${entry.address}:${port}/`);
    }
  }

  return urls;
}

console.log('');
console.log('EVENT ORGANIZER SYSTEM');
console.log(`  Local:    http://localhost:${appPort}/`);

const networkUrls = getNetworkUrls(appPort);
if (networkUrls.length > 0) {
  for (const url of networkUrls) {
    console.log(`  Network:  ${url}`);
  }
} else {
  console.log('  Network:  use --host to expose');
}

console.log(`  API:      http://localhost:${apiPort}/events`);
console.log('  MongoDB:  connected through backend/.env');
console.log('');
