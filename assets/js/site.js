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

  // "Get directions" chooser: every Google Maps directions link on the site
  // opens a small menu (Apple Maps / Google Maps / Waze) instead. Without JS
  // the links still go straight to Google Maps.
  var ADDR = "2500 Yale Blvd SE, Albuquerque, NM 87106";
  var LL = "35.0543,-106.6217";
  var sheet, lastTrigger;

  var buildSheet = function () {
    sheet = document.createElement("div");
    sheet.className = "dir-sheet";
    sheet.hidden = true;
    sheet.innerHTML =
      '<div class="dir-sheet__panel" role="dialog" aria-modal="true" aria-labelledby="dir-sheet-title">' +
        '<p class="dir-sheet__kicker">Get directions</p>' +
        '<h2 class="dir-sheet__title" id="dir-sheet-title">Yale Landing</h2>' +
        '<p class="dir-sheet__addr">' + ADDR + '</p>' +
        '<div class="dir-sheet__opts">' +
          '<a class="dir-sheet__opt" data-app="apple" target="_blank" rel="noopener">Apple Maps<span aria-hidden="true">&rarr;</span></a>' +
          '<a class="dir-sheet__opt" data-app="google" target="_blank" rel="noopener">Google Maps<span aria-hidden="true">&rarr;</span></a>' +
          '<a class="dir-sheet__opt" data-app="waze" target="_blank" rel="noopener">Waze<span aria-hidden="true">&rarr;</span></a>' +
        '</div>' +
        '<button type="button" class="dir-sheet__cancel">Cancel</button>' +
      '</div>';
    document.body.appendChild(sheet);
    sheet.addEventListener("click", function (e) {
      if (e.target === sheet || e.target.closest(".dir-sheet__cancel")) closeSheet();
      else if (e.target.closest(".dir-sheet__opt")) setTimeout(closeSheet, 50);
    });
    sheet.addEventListener("keydown", function (e) {
      if (e.key === "Escape") { e.preventDefault(); closeSheet(); return; }
      if (e.key !== "Tab") return;
      var f = sheet.querySelectorAll("a, button");
      var first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    });
  };

  var openSheet = function (link) {
    if (!sheet) buildSheet();
    var q = "";
    try { q = new URL(link.href).searchParams.get("query") || ""; } catch (err) {}
    if (!q) q = ADDR;
    // "Perico's 2500 Yale Blvd SE ..." -> "Perico's"; plain address -> "Yale Landing"
    var name = q.split(/\s+2500\b/)[0].trim();
    if (!name || /^2500\b/.test(q)) name = "Yale Landing";
    sheet.querySelector(".dir-sheet__title").textContent = name;
    sheet.querySelector('[data-app="apple"]').href =
      "https://maps.apple.com/?daddr=" + encodeURIComponent(ADDR) + "&dirflg=d";
    sheet.querySelector('[data-app="google"]').href =
      "https://www.google.com/maps/dir/?api=1&destination=" + encodeURIComponent(q);
    sheet.querySelector('[data-app="waze"]').href =
      "https://waze.com/ul?ll=" + LL + "&navigate=yes&zoom=17";
    lastTrigger = link;
    sheet.hidden = false;
    document.documentElement.classList.add("dir-open");
    requestAnimationFrame(function () { sheet.classList.add("is-open"); });
    sheet.querySelector(".dir-sheet__opt").focus({ preventScroll: true });
  };

  var closeSheet = function () {
    if (!sheet || sheet.hidden) return;
    sheet.classList.remove("is-open");
    document.documentElement.classList.remove("dir-open");
    setTimeout(function () { sheet.hidden = true; }, 180);
    if (lastTrigger) lastTrigger.focus({ preventScroll: true });
  };

  document.addEventListener("click", function (e) {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    var a = e.target.closest && e.target.closest('a[href*="google.com/maps"]');
    if (!a || a.closest(".dir-sheet")) return;
    e.preventDefault();
    openSheet(a);
  });

  // Footer year
  document.querySelectorAll("[data-year]").forEach(function (el) {
    el.textContent = new Date().getFullYear();
  });
})();
