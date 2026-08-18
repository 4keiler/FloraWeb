const puppeteer = require('puppeteer');
const fs = require('fs');
(async () => {
  const browser = await puppeteer.launch({
    headless: 'new',
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();
  await page.goto('https://nymphaicosmetics.com/', { waitUntil: 'networkidle0', timeout: 30000 });

  // Get ALL script tags that exist in the DOM (including dynamically added ones)
  const scripts = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('script')).map(s => ({
      src: s.src || '',
      type: s.type || '',
      text: (s.textContent || '').slice(0, 100)
    }));
  });

  console.log('=== All script tags in DOM ===');
  scripts.forEach((s, i) => {
    if (s.src) console.log(i + ': src=' + s.src.slice(0, 200));
    else if (s.text.trim()) console.log(i + ': inline (starts with: ' + s.text.trim().slice(0, 80) + '...)');
    else console.log(i + ': empty');
  });

  await browser.close();
})().catch(e => { console.error(e); process.exit(1); });
