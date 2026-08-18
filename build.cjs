const fs = require('fs');

function removeScriptContaining(html, marker) {
  const idx = html.indexOf(marker);
  if (idx === -1) return html;
  let searchStart = 0;
  while (true) {
    const scriptStart = html.indexOf('<script', searchStart);
    if (scriptStart === -1 || scriptStart > idx) return html;
    const scriptEnd = html.indexOf('</script>', scriptStart);
    if (scriptEnd === -1) return html;
    const between = html.slice(scriptStart, scriptEnd + 9);
    if (between.includes(marker)) {
      return html.slice(0, scriptStart) + html.slice(scriptEnd + 9);
    }
    searchStart = scriptEnd + 9;
  }
}

function removeTagAt(html, id) {
  const idx = html.indexOf(id);
  if (idx === -1) return html;
  const start = html.lastIndexOf('<', idx);
  const end = html.indexOf('>', idx) + 1;
  if (start === -1 || end === 0) return html;
  return html.slice(0, start) + html.slice(end);
}

let html = fs.readFileSync('src/pages/index.astro', 'utf8');
console.log('Original: ' + html.length + ' bytes');

// ===== PHASE 1: Remove broken Shopify scripts =====
html = removeScriptContaining(html, 'trekkie.storefront');
html = removeScriptContaining(html, 'web-pixels-manager-setup');
html = removeScriptContaining(html, 'monorail-edge.shopifysvc.com');
html = removeScriptContaining(html, 'window.__TREKKIE_SHIM_QUEUE');
html = removeScriptContaining(html, 'window.ShopifyAnalytics=window.ShopifyAnalytics');
html = removeScriptContaining(html, 'ShopifyAnalytics.meta');
html = removeScriptContaining(html, 'Shopify.PaymentButton');
html = removeScriptContaining(html, 'standard-actions.js');
html = removeScriptContaining(html, 'document.documentElement.className');
html = removeScriptContaining(html, 'Shopify.designMode');
html = removeScriptContaining(html, 'shop_events_listener');
html = removeScriptContaining(html, 'storefront/load_feature');
html = removeScriptContaining(html, 'shopify_pay/storefront-bf1cdb70');
html = removeScriptContaining(html, '/cdn/shopifycloud/shop-js/');
html = removeScriptContaining(html, 'privacy-banner/storefront-banner.js');
html = removeScriptContaining(html, 'portable-wallets');
html = removeScriptContaining(html, '/cdn/wpm/');
html = removeScriptContaining(html, 'function updateCartCount');
html = removeScriptContaining(html, 'perf-kit');
html = removeScriptContaining(html, 'checkouts/internal/preloads');

// Remove tags
html = removeTagAt(html, 'shopify-accelerated-checkout-styles');
html = removeTagAt(html, 'shopify-cfh-end');
html = removeTagAt(html, 'monorail-edge.shopifysvc.com');

// Remove web-pixels div
const sandbox = html.indexOf('web-pixels-manager-sandbox-container');
if (sandbox >= 0) {
  const start = html.lastIndexOf('<div', sandbox);
  let depth = 1, pos = html.indexOf('>', start) + 1;
  while (depth > 0 && pos < html.length) {
    const o = html.indexOf('<div', pos);
    const c = html.indexOf('</div>', pos);
    if (c === -1) break;
    if (o !== -1 && o < c) { depth++; pos = o + 5; }
    else { depth--; pos = c + 6; }
  }
  if (depth === 0) html = html.slice(0, start) + html.slice(pos);
}

// Remove Shopify CDN link
html = removeTagAt(html, 'monorail-edge.shopifysvc.com');

// Remove origin_trials script reference (bad protocol)
html = removeScriptContaining(html, 'origin_trials');

// ===== PHASE 1.5: Remove remaining Shopify scaffolding =====

// Remove ALL shopify content_for_header performance markers (there are 2: .start and .end)
html = html.replace(/<script[^>]*>[\s\S]*?window\.performance\..*?shopify\.content_for_header.*?<\/script>/g, '');

// Remove shopify meta tags and inline scripts by marker
['shopify-digital-wallet', 'shopify-checkout-api-token', 'apple-pay-shop-capabilities',
 'shopify-features', 'Shopify.shop =', 'captcha-bootstrap',
 'shopify.dynamic_checkout.cart.bootstrap', 'shopify-accelerated-checkout-cart',
 'shopify-buyer-consent', 'shopify-subscription-policy-button',
 'data-source-attribution', 'dynamic-checkout-cart'].forEach(m => {
  // try as script first
  const s = removeScriptContaining(html, m);
  if (s !== html) { html = s; return; }
  // try as tag
  const t = removeTagAt(html, m);
  if (t !== html) html = t;
});

// Remove lang-menu (Shopify localization forms)
const langMenu = html.indexOf('lang-menu__dropdown');
if (langMenu >= 0) {
  const start = html.lastIndexOf('<div', langMenu);
  let depth = 1, pos = html.indexOf('>', start) + 1;
  while (depth > 0 && pos < html.length) {
    const o = html.indexOf('<div', pos);
    const c = html.indexOf('</div>', pos);
    if (c === -1) break;
    if (o !== -1 && o < c) { depth++; pos = o + 5; }
    else { depth--; pos = c + 6; }
  }
  if (depth === 0) html = html.slice(0, start) + html.slice(pos);
}

// Remove shopify-section wrapper divs (keep their inner content)
html = html.replace(/<div[^>]*id="shopify-section-[^"]*"[^>]*>/g, '');
html = html.replace(/<\/div>\s*<!--\s*End\s+shopify-section\s*-->/g, '');
html = html.replace(/<\/div>\s*<div id="shopify-section-template--/g, '<div id="shopify-section-template--');

// Remove Shopify CDN preconnect link
html = html.replace(/<link rel="preconnect" href="https:\/\/cdn\.shopify\.com"[^>]*>/g, '');
// Remove empty data-shopify style tags
html = html.replace(/<style[^>]*data-shopify[^>]*>\s*<\/style>/g, '');
// Change Shopify CDN favicon to local
html = html.replace(/\/\/floracosmetics\.com\/cdn\/shop\/files\/apple-touch-icon\.png[^"']*/g, '/assets/apple-touch-icon.png');

console.log('After removal: ' + html.length + ' bytes');

// ===== PHASE 2: Replace CDN asset URLs with local paths =====
html = html.replace(/\/\/floracosmetics\.com\/cdn\/shop\/t\/2\/assets\//g, '/assets/');
html = html.replace(/https:\/assets\//g, '/assets/');
html = html.replace(/http:\/assets\//g, '/assets/');

// Fix specific file paths
['main.js', 'global.js', 'scroll-progress.js', 'constants.js', 'pubsub.js'].forEach(f => {
  html = html.replace(new RegExp('/assets/' + f.replace(/\./g, '\\.'), 'g'), '/scripts/' + f);
});
['main.css', 'base.css'].forEach(f => {
  html = html.replace(new RegExp('/assets/' + f.replace(/\./g, '\\.'), 'g'), '/styles/' + f);
});

console.log('After path replace: ' + html.length + ' bytes');

// ===== PHASE 3: Add fallback script to fix Lenis/scroll/preloader =====

// First remove any previously injected fallback scripts (marked with FALLBACK_BLOCK)
html = html.replace(/<!--FALLBACK_BLOCK-->[\s\S]*?<!--\/FALLBACK_BLOCK-->/g, '');

const fallbackScript = `
<!--FALLBACK_BLOCK-->
<script>
(function(){
  var fallbackTimer = setTimeout(function() {
    if (window.lenis && window.lenis.isStopped) {
      window.lenis.start();
    }
    var preloader = document.getElementById('preloader');
    if (preloader && preloader.style.opacity !== '0') {
      preloader.remove();
      document.body.style.overflow = '';
    }
    window.dispatchEvent(new Event('preloader-done'));
    if (typeof ScrollTrigger !== 'undefined') ScrollTrigger.refresh();
  }, 5000);
  window.addEventListener('preloader-done', function() {
    clearTimeout(fallbackTimer);
  }, {once: true});
})();
</script>
<!--/FALLBACK_BLOCK-->`;

// Insert just before </body>
html = html.replace('</body>', fallbackScript + '\n</body>');

console.log('After fallback: ' + html.length + ' bytes');

// ===== PHASE 4: Write files =====
fs.writeFileSync('public/index.html', html);

let astro = html;
astro = astro.replace(/<script(?![^>]*is:inline)([^>]*>)/g, '<script is:inline$1');
astro = astro.replace(/<style(?![^>]*is:global)([^>]*>)/g, '<style is:global$1');
fs.writeFileSync('src/pages/index.astro', astro);

// Stats
const localAssets = (html.match(/\/assets\//g) || []).length;
const lineeSpline = html.includes('linee-spline.js') ? 'present' : 'MISSING';
const gsap = html.includes('gsap.min.js') ? 'present' : 'MISSING';
const lenis = html.includes('lenis.min.js') ? 'present' : 'MISSING';
const hasFallback = html.includes('FALLBACK_BLOCK') ? 'present' : 'MISSING';
console.log(`Stats: assets=${localAssets}, linee-spline=${lineeSpline}, GSAP=${gsap}, Lenis=${lenis}, fallback=${hasFallback}`);
