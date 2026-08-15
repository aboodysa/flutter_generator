// Static SPA server for Flutter web builds (walkthrough variant).
// root from argv[2] or env ROOT; port from env PORT (default 8081). No-cache headers.
const http = require('http');
const fs = require('fs');
const path = require('path');
const root = process.argv[2] || process.env.ROOT || '/Users/username/Documents/cto/flutter_generator/apps/tasks/output/app/build/web';
const port = parseInt(process.env.PORT || '8081', 10);
http.createServer((req, res) => {
  let p = decodeURIComponent(req.url.split('?')[0]);
  if (p === '/') p = '/index.html';
  let file = path.join(root, p);
  if (!fs.existsSync(file) || fs.statSync(file).isDirectory()) file = path.join(root, 'index.html');
  const ext = path.extname(file);
  const mime = {'.html':'text/html','.js':'text/javascript','.css':'text/css','.png':'image/png','.json':'application/json','.otf':'font/otf','.ttf':'font/ttf','.wasm':'application/wasm','.ico':'image/x-icon','.svg':'image/svg+xml'}[ext] || 'application/octet-stream';
  res.writeHead(200, {'Content-Type': mime, 'Cache-Control': 'no-store, no-cache, must-revalidate', 'Pragma': 'no-cache', 'Expires': '0'});
  fs.createReadStream(file).pipe(res);
}).listen(port, '127.0.0.1', () => console.log(`static (no-cache) on ${port}, root=${root}`));
