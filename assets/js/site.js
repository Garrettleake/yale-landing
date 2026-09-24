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
  // compact bar as soon as you start reading.
  //
  // The header is position:fixed (html.hdr-fixed) and the body reserves its
  // height (--hdr-h at rest, --hdr-c when compact, animated together with
  // the bar), so the page slides up smoothly instead of jumping, and the
  // toggle can't feed back into the scroll position.
  var header = document.querySelector(".site-header");
  if (header) {
    var root = document.documentElement;
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
      root.style.setProperty("--hdr-h", f + "px");
      root.style.setProperty("--hdr-c", k + "px");
    };

    var setCompact = function (on) {
      header.classList.toggle("is-compact", on);
      root.classList.toggle("hdr-compact", on);
    };
    // Compact a few pixels in; expand again only at the very top.
    var sync = function () {
      var y = window.scrollY || window.pageYOffset;
      if (y > 12) setCompact(true);
      else if (y < 4) setCompact(false);
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
