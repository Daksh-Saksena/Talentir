const http = require('http');
const httpProxy = require('http-proxy');

const TARGET = 'http://localhost:3000';
const PORT = 8000;

const proxy = httpProxy.createProxyServer({ target: TARGET, ws: true });

proxy.on('error', (err, req, res) => {
  if (res && typeof res.writeHead === 'function') {
    res.writeHead(502, { 'Content-Type': 'text/plain' });
    res.end('IP Panel Proxy Error: Main server on port 3000 is not ready or unreachable.');
  }
});

const server = http.createServer((req, res) => {
  if (req.url === '/' || req.url === '/index.html') {
    res.writeHead(302, { Location: '/live-class' });
    res.end();
    return;
  }
  proxy.web(req, res);
});

server.on('upgrade', (req, socket, head) => {
  proxy.ws(req, socket, head);
});

server.listen(PORT, () => {
  console.log(`\x1b[36m[IP Panel]\x1b[0m Hosted and accessible at http://localhost:${PORT}/live-class -> forwarding to ${TARGET}`);
});
