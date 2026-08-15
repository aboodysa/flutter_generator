const http = require('http');
const fs = require('fs');
const path = require('path');
const root = '/Users/username/Documents/cto/flutter_generator/apps/tasks/output/app/build/web';
http.createServer((req, res) => {
  let p = decodeURIComponent(req.url.split('?')[0]);
  if (p === '/') p = '/index.html';
  let file = path.join(root, p);
  if (!fs.existsSync(file) || fs.statSync(file).isDirectory()) file = path.join(root, 'index.html');
  const ext = path.extname(file);
  const mime = {'.html':'text/html','.js':'text/javascript','.css':'text/css','.png':'image/png','.json':'application/json','.otf':'font/otf','.ttf':'font/ttf','.wasm':'application/wasm','.ico':'image/x-icon','.svg':'image/svg+xml'}[ext] || 'application/octet-stream';
  res.writeHead(200, {'Content-Type': mime});
  fs.createReadStream(file).pipe(res);
}).listen(8081, '127.0.0.1', () => console.log('tasks static on 8081'));
