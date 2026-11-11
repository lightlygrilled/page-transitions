(function () {
  "use strict";

  var BOX_SELECTOR = "[data-transition-box]";
  var DEFAULT_EVENT = "Page Exit";
  var DEFAULT_EXIT_MS = 900;
  var IGNORE_ATTR = "data-transition-ignore";

  var isTransitioning = false;
  var transitionConfig = null;

  function prefersReducedMotion() {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }

  function getIx3() {
    try {
      if (!window.Webflow) return null;
      return Webflow.require("ix3");
    } catch (err) {
      return null;
    }
  }

  function parsePositiveMs(raw, fallback) {
    if (raw === undefined || raw === null || raw === "") return fallback;
    var n = parseInt(String(raw).trim(), 10);
    if (isNaN(n) || n < 0) return fallback;
    return n;
  }

  function readConfigFromBox(box) {
    var eventName =
      box.getAttribute("data-transition-event") || DEFAULT_EVENT;
    var exitWaitMs = parsePositiveMs(
      box.getAttribute("data-transition-duration"),
      DEFAULT_EXIT_MS
    );
    return {
      exitEventName: eventName.trim() || DEFAULT_EVENT,
      exitWaitMs: exitWaitMs,
    };
  }

  function isPageNavigation(link) {
    if (!(link instanceof HTMLAnchorElement) || !link.href) return false;
    if (link.hasAttribute(IGNORE_ATTR)) return false;
    if (link.hasAttribute("download")) return false;
    if (link.target && link.target !== "_self") return false;

    var url;
    try {
      url = new URL(link.href, window.location.href);
    } catch (err) {
      return false;
    }

    if (url.origin !== window.location.origin) return false;
    if (url.protocol === "mailto:" || url.protocol === "tel:") return false;

    var samePath =
      url.pathname === window.location.pathname &&
      url.search === window.location.search;

    if (samePath && url.hash) return false;

    if (url.href === window.location.href) return false;

    return true;
  }

  function navigateAfterExit(href) {
    window.location.assign(href);
  }

  function handleClick(event) {
    if (!transitionConfig) return;
    if (event.defaultPrevented) return;
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    if (isTransitioning) {
      event.preventDefault();
      return;
    }

    var link = event.target.closest("a[href]");
    if (!link || !isPageNavigation(link)) return;

    if (prefersReducedMotion()) return;

    var ix3 = getIx3();
    if (!ix3) return;

    event.preventDefault();
    isTransitioning = true;
    document.documentElement.classList.add("is-transition-active");

    var cfg = transitionConfig;

    function runExit() {
      ix3.emit(cfg.exitEventName);
      window.setTimeout(function () {
        navigateAfterExit(link.href);
      }, cfg.exitWaitMs);
    }

    if (typeof ix3.ready === "function") {
      ix3.ready().then(runExit).catch(runExit);
    } else {
      runExit();
    }
  }

  function init() {
    var box = document.querySelector(BOX_SELECTOR);
    if (!box) {
      console.warn(
        "[page-transitions] Missing " +
          BOX_SELECTOR +
          " — link interception disabled."
      );
      return;
    }

    transitionConfig = readConfigFromBox(box);
    document.addEventListener("click", handleClick, false);
  }

  window.Webflow = window.Webflow || [];
  window.Webflow.push(function () {
    init();
  });
})();
