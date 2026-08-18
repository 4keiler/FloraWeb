(function () {
  var imgs = Array.prototype.slice.call(document.querySelectorAll('.spline-product-img'));
  var track = document.querySelector('#prodotti .prodotti__track');
  var wrap = document.querySelector('#prodotti-wrap');
  if (!imgs.length || !track) return;
  if (window.innerWidth <= 990) return;
  var slideWidth = window.innerWidth;
  var ticking = false;

  function sync() {
    ticking = false;
    var trackX = 0;
    if (typeof gsap !== 'undefined' && gsap.getProperty) {
      trackX = gsap.getProperty(track, 'x') || 0;
    }
    var wrapRect = wrap ? wrap.getBoundingClientRect() : null;
    var fadeZone = window.innerHeight * 0.6;
    var fadeOpacity = wrapRect ? Math.min(1, Math.max(0, (fadeZone - wrapRect.top) / fadeZone)) : 0;
    var sectionVisible = wrapRect && wrapRect.top <= fadeZone && wrapRect.bottom > window.innerHeight * 0.4;
    if (!sectionVisible || fadeOpacity <= 0) {
      imgs.forEach(function (img) {
        img.style.visibility = 'hidden';
        img.style.opacity = '0';
      });
      return;
    }
    imgs.forEach(function (img, i) {
      var slideCenter = i * slideWidth + slideWidth / 2 + trackX;
      var viewCenter = slideWidth / 2;
      var distRaw = (slideCenter - viewCenter) / slideWidth;
      var distNorm = Math.min(Math.abs(distRaw), 1);
      var parallax = distRaw > 0 ? distRaw * slideWidth * -0.5 : 0;
      var slideUpY = (1 - fadeOpacity) * 80;
      img.style.transform = 'translate(-50%,-50%) translateX(' + (trackX + i * slideWidth + parallax) + 'px) translateY(' + slideUpY + 'px)';
      var centerOpacity = distNorm > 0.1 ? 1 - distNorm * 0.3 : 1;
      img.style.opacity = String(fadeOpacity * centerOpacity);
      img.style.filter = distNorm > 0.1 ? 'blur(' + distNorm * 1.5 + 'px)' : 'none';
      img.style.visibility = 'visible';
    });
  }

  function requestSync() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(sync);
  }

  addEventListener('scroll', requestSync, { passive: true });
  addEventListener('resize', function () {
    slideWidth = window.innerWidth;
    requestSync();
  });
  if (typeof gsap !== 'undefined' && gsap.ticker) {
    gsap.ticker.add(requestSync);
  }
  requestSync();
})();