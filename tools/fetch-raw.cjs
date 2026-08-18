const puppeteer = require('puppeteer');
const fs = require('fs');
(async () => {
  const browser = await puppeteer.launch({
    headless: 'new',
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();

  // Intercept the main document response and get raw HTML before JS
  let rawHtml = null;
  page.on('response', async (response) => {
    if (response.url() === 'https://nymphaicosmetics.com/' && response.status() === 200) {
      try {
        rawHtml = await response.text();
        console.log('Raw HTML captured: ' + rawHtml.length + ' bytes');
      } catch(e) { console.error('Failed to get raw text:', e.message); }
    }
  });

  await page.goto('https://nymphaicosmetics.com/', { waitUntil: 'networkidle0', timeout: 30000 });
  
  if (rawHtml) {
    fs.writeFileSync('src/pages/index.astro', rawHtml);
    console.log('Saved raw HTML');
  } else {
    // Fallback: get HTML with JS disabled
    console.log('Raw capture failed, using no-JS fallback');
    await page.setJavaScriptEnabled(false);
    await page.goto('https://nymphaicosmetics.com/', { waitUntil: 'networkidle0', timeout: 30000 });
    const html = await page.content();
    fs.writeFileSync('src/pages/index.astro', html);
    console.log('Saved no-JS HTML: ' + html.length + ' bytes');
  }

  await browser.close();
})().catch(e => { console.error(e); process.exit(1); });
