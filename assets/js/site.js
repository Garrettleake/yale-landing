/* YALE — shared behaviour. Small on purpose: nav toggle, shrinking header, footer year. */
(function () {
  "use strict";

  // Mobile nav
  var toggle = document.querySelector(".nav-toggle");
  var nav = document.getElementById("site-nav");

  if (toggle && nav) {
    toggle.addEventListener("click", function () {
      var open = nav.classList.toggle("is-open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
    });

    // Close the menu after tapping a link
    nav.addEventListener("click", function (e) {
      if (e.target.tagName === "A") {
        nav.classList.remove("is-open");
        toggle.setAttribute("aria-expanded", "false");
      }
    });
  }

  // Header shrinks on scroll: full-size lockup at the top of the page,
  // compact bar once you start reading.
  //
  // The header is position:fixed (html.hdr-fixed) and the body reserves the
  // full-size height in --hdr-h, so shrinking the bar never moves the page.
  // Two thresholds (compact past one, expand back only well above it) stop
  // the bar flapping when the scroll position sits right on the line.
  var header = document.querySelector(".site-header");
  if (header) {
    var root = document.documentElement;
    var fullH = 0, compactH = 0, compactAt = 90, expandAt = 30;
    var ticking = false;

    // Measure the bar in a given state without disturbing the real one:
    // a hidden clone with transitions switched off.
    var measure = function (compact) {
      var c = header.cloneNode(true);
      c.classList.toggle("is-compact", compact);
      c.removeAttribute("id");
      c.style.cssText = "position:absolute;left:0;right:0;top:0;visibility:hidden;pointer-events:none;transition:none";
      c.querySelectorAll("*").forEach(function (el) {
        el.style.transition = "none";
        el.classList.remove("is-open");
        el.removeAttribute("id");
      });
      document.body.appendChild(c);
      var h = c.offsetHeight;
      c.remove();
      return h;
    };

    var calibrate = function () {
      var f = measure(false), k = measure(true);
      if (!f || !k) return;
      fullH = f; compactH = k;
      root.style.setProperty("--hdr-h", fullH + "px");
      root.style.setProperty("--hdr-c", compactH + "px");
      // Shrink only once the page has scrolled at least as far as the bar
      // will shrink (plus a little hysteresis), and grow back as soon as it
      // hasn't — so no blank band ever opens between the bar and the content.
      var delta = fullH - compactH;
      expandAt = Math.max(40, delta);
      compactAt = expandAt + 40;
    };

    var sync = function () {
      var y = window.scrollY || window.pageYOffset;
      if (y > compactAt) header.classList.add("is-compact");
      else if (y < expandAt) header.classList.remove("is-compact");
      ticking = false;
    };
    var onScroll = function () {
      if (!ticking) { ticking = true; window.requestAnimationFrame(sync); }
    };

    root.classList.add("hdr-fixed");
    calibrate();
    sync();
    window.addEventListener("scroll", onScroll, { passive: true });

    // Re-measure when anything that changes the bar's height settles:
    // viewport resize, web fonts arriving, the logo image loading.
    var recal = function () { calibrate(); sync(); };
    var resizeTimer;
    window.addEventListener("resize", function () {
      clearTimeout(resizeTimer); resizeTimer = setTimeout(recal, 120);
    });
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(recal);
    var logo = header.querySelector(".brand-word img");
    if (logo && !logo.complete) logo.addEventListener("load", recal);
    window.addEventListener("load", recal);
  }

  // Footer year
  document.querySelectorAll("[data-year]").forEach(function (el) {
    el.textContent = new Date().getFullYear();
  });
})();
