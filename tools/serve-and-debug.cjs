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

const server = http.createServer((req, res) => {
  const cleanUrl = req.url.split('?')[0].split('#')[0];
  let filePath = path.join(__dirname, 'public', cleanUrl === '/' ? 'index.html' : cleanUrl);
  const ext = path.extname(filePath);
  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404);
      res.end('');
    } else {
      res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
      res.end(data);
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
    
    const page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 900 });
    
    // Track failed requests
    const failedRequests = new Set();
    page.on('requestfailed', req => {
      failedRequests.add(req.url() + ' -> ' + req.failure().errorText);
    });
    page.on('response', resp => {
      if (resp.status() >= 400) {
        failedRequests.add(resp.url() + ' -> HTTP ' + resp.status());
      }
    });
    
    await page.goto('http://localhost:' + PORT, { waitUntil: 'networkidle0', timeout: 25000 });
    
    const h = await page.evaluate(() => document.body.scrollHeight);
    console.log('Height: ' + h + 'px');
    
    // Check for key elements
    const checks = await page.evaluate(() => {
      return {
        splineCanvases: document.querySelectorAll('#spline-canvas-1, #spline-canvas-2, #spline-canvas-3').length,
        splineReady: typeof window.__SPLINE_READY__ !== 'undefined' ? window.__SPLINE_READY__ : 'not set',
        slides: typeof window.__NYMPHAI_SLIDES__ !== 'undefined' ? window.__NYMPHAI_SLIDES__.length : 'not set',
        lenis: typeof window.lenis !== 'undefined' ? 'present' : 'not set',
        gsap: typeof window.gsap !== 'undefined' ? 'present' : 'not set',
        scrollTrigger: typeof window.ScrollTrigger !== 'undefined' ? 'present' : 'not set',
        bodyHTML: document.body.innerHTML.length + ' bytes',
        brandSection: document.querySelector('#brand') ? 'present' : 'missing',
        prodottiSection: document.querySelector('#prodotti') ? 'present' : 'missing',
        linesSection: document.querySelector('#lines-section') ? 'present' : 'missing',
        footerSection: document.querySelector('.footer') ? 'present' : 'missing',
        canvasHeight1: document.querySelector('#spline-canvas-1') ? document.querySelector('#spline-canvas-1').offsetHeight : 0,
      };
    });
    
    console.log('=== Page checks ===');
    for (const [key, val] of Object.entries(checks)) {
      console.log('  ' + key + ': ' + val);
    }
    
    console.log('\n=== Failed requests (first 20) ===');
    [...failedRequests].slice(0, 20).forEach(r => console.log('  ' + r));
    
    await page.screenshot({ path: 'screenshot-local.png', fullPage: true });
    console.log('\nScreenshot saved');
    await browser.close();
  } catch(e) {
    console.error('Error:', e.message);
  }
  server.close();
});
