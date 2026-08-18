const http = require('http');
const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');

const ROOT = process.cwd();
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.avif': 'image/avif', '.svg': 'image/svg+xml', '.mp4': 'video/mp4', '.json': 'application/json', '.ico': 'image/x-icon' };
const server = http.createServer((req, res) => {
  let p = decodeURIComponent(req.url.split('?')[0]);
  if (p === '/') p = '/index.html';
  const file = path.join(ROOT, 'public', p);
  if (!fs.existsSync(file) || fs.statSync(file).isDirectory()) { res.writeHead(404); res.end('404'); return; }
  res.writeHead(200, { 'Content-Type': MIME[path.extname(file)] || 'application/octet-stream' });
  fs.createReadStream(file).pipe(res);
});

(async () => {
  await new Promise(r => server.listen(3000, r));
  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox', '--force-device-scale-factor=1'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });
  const errors = [];
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('pageerror', e => errors.push(String(e)));
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle0', timeout: 60000 });
  await page.waitForFunction(() => document.getElementById('preloader') === null, { timeout: 20000 });
  await new Promise(r => setTimeout(r, 500));
  await page.evaluate(() => window.scrollTo(0, 5500));
  await new Promise(r => setTimeout(r, 1500));

  const info = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('.spline-product-img')).map((img, i) => {
      const r = img.getBoundingClientRect();
      return {
        i,
        src: img.getAttribute('src').split('/').pop(),
        cssW: getComputedStyle(img).width,
        cssH: getComputedStyle(img).height,
        rectW: Math.round(r.width),
        rectH: Math.round(r.height),
        ratio: (r.height / r.width).toFixed(2),
        opacity: getComputedStyle(img).opacity
      };
    });
  });
  console.log(JSON.stringify(info, null, 1));
  console.log('ERRORS:', JSON.stringify(errors));
  await browser.close();
  server.close();
  process.exit(0);
})().catch(e => { console.error(e); process.exit(1); });