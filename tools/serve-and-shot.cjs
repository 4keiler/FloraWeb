const http = require('http');
const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');

const PORT = 3000;
const MIME = {
  '.html': 'text/html', '.css': 'text/css', '.js': 'application/javascript',
  '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg', '.gif': 'image/gif', '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon', '.webp': 'image/webp', '.avif': 'image/avif',
  '.mp4': 'video/mp4', '.splinecode': 'application/octet-stream'
};

// Serve from both public/ and public/assets/ for direct access
const dirs = {
  '/': path.join(__dirname, 'public'),
};

const server = http.createServer((req, res) => {
  const cleanUrl = req.url.split('?')[0].split('#')[0];
  let filePath = path.join(__dirname, 'public', cleanUrl === '/' ? 'index.html' : cleanUrl);
  const ext = path.extname(filePath);
  fs.stat(filePath, (err, stat) => {
    if (err) {
      res.writeHead(404);
      res.end('');
      return;
    }
    const fileSize = stat.size;
    const range = req.headers.range;
    if (range) {
      const parts = range.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
      const chunkSize = end - start + 1;
      const stream = fs.createReadStream(filePath, { start, end });
      res.writeHead(206, {
        'Content-Range': `bytes ${start}-${end}/${fileSize}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunkSize,
        'Content-Type': MIME[ext] || 'application/octet-stream'
      });
      stream.pipe(res);
    } else {
      fs.readFile(filePath, (err, data) => {
        if (err) {
          res.writeHead(404);
          res.end('');
        } else {
          res.writeHead(200, {
            'Content-Type': MIME[ext] || 'application/octet-stream',
            'Accept-Ranges': 'bytes'
          });
          res.end(data);
        }
      });
    }
  });
});

server.listen(PORT, async () => {
  console.log('Server on http://localhost:' + PORT);
  try {
    const browser = await puppeteer.launch({
      headless: 'new',
      executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    // With JS
    const page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 900 });
    page.on('console', msg => {
      if (msg.type() === 'error') {
        const text = msg.text();
        if (!text.includes('monorail') && !text.includes('CORS') && !text.includes('api/collect')) {
          console.log('  ERR:', text.slice(0, 120));
        }
      }
    });
    await page.goto('http://localhost:' + PORT, { waitUntil: 'networkidle0', timeout: 25000 });
    const h = await page.evaluate(() => document.body.scrollHeight);
    console.log('With JS: height=' + h + 'px');
    await page.screenshot({ path: 'screenshot-local.png', fullPage: true });
    console.log('Screenshot saved');
    
    await browser.close();
  } catch(e) {
    console.error('Error:', e.message);
  }
  server.close();
});
