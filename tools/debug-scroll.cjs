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
  console.log('Server started');
  try {
    const browser = await puppeteer.launch({
      headless: 'new',
      executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-web-security']
    });
    
    const page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 900 });
    
    const allConsole = [];
    page.on('console', msg => {
      allConsole.push(msg.type() + ': ' + msg.text().slice(0, 200));
    });
    page.on('pageerror', err => {
      allConsole.push('PAGE ERROR: ' + err.message.slice(0, 200));
    });
    
    await page.goto('http://localhost:' + PORT, { waitUntil: 'networkidle0', timeout: 25000 });
    
    // Wait a bit more for async scripts
    await page.evaluate(() => new Promise(r => setTimeout(r, 3000)));
    
    console.log('=== Console errors/events ===');
    allConsole.filter(c => c.startsWith('error') || c.startsWith('PAGE')).slice(0, 30).forEach(c => console.log(c));
    
    // Check scroll behavior
    const scrollInfo = await page.evaluate(() => {
      if (typeof lenis !== 'undefined') {
        return {
          lenisExists: true,
          isScrolling: lenis.isScrolling,
          progress: lenis.progress,
          direction: lenis.direction,
          velocity: lenis.velocity,
          isStopped: lenis.isStopped,
          targetScroll: lenis.targetScroll,
        };
      }
      return { lenisExists: false };
    });
    console.log('\n=== Lenis state ===');
    for (const [k, v] of Object.entries(scrollInfo)) console.log('  ' + k + ': ' + v);
    
    // Check what GSAP ScrollTrigger is doing
    const stInfo = await page.evaluate(() => {
      if (typeof ScrollTrigger !== 'undefined') {
        const triggers = ScrollTrigger.getAll();
        return {
          totalTriggers: triggers.length,
          activeTriggers: triggers.filter(t => t.isActive || t.progress > 0).length,
          triggerNames: triggers.slice(0, 10).map(t => t.vars.id || t.vars.trigger || 'unnamed'),
        };
      }
      return { totalTriggers: 'ScrollTrigger not found' };
    });
    console.log('\n=== ScrollTrigger state ===');
    for (const [k, v] of Object.entries(stInfo)) console.log('  ' + k + ': ' + JSON.stringify(v).slice(0, 200));
    
    await browser.close();
  } catch(e) {
    console.error('Error:', e.message);
  }
  server.close();
});
