/**
 * main.js — Shared chrome behavior for every page
 * ---------------------------------------------------------------------------
 * Responsibilities:
 *   1. Mobile nav open/close (aria-expanded, Escape, outside click)
 *   2. Mark current nav item via data-nav matching location
 *   3. Landing header scroll class (safe no-op on traditional pages)
 *
 * Loaded on all pages. Landing-specific motion lives in landing-motion.js.
 */

(function () {
  "use strict";

  /**
   * Mobile navigation
   * Pattern: button toggles .is-open on the nav landmark and mirrors state
   * in aria-expanded so screen readers announce open/closed correctly.
   */
  function initMobileNav() {
    var toggle = document.querySelector(".nav-toggle");
    var nav = document.querySelector(".nav-primary");
    if (!toggle || !nav) return;

    function setOpen(open) {
      nav.classList.toggle("is-open", open);
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
      toggle.textContent = open ? "Close" : "Menu";
    }

    toggle.addEventListener("click", function () {
      setOpen(!nav.classList.contains("is-open"));
    });

    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape") setOpen(false);
    });

    document.addEventListener("click", function (event) {
      if (!nav.classList.contains("is-open")) return;
      if (nav.contains(event.target) || toggle.contains(event.target)) return;
      setOpen(false);
    });

    // Close after choosing a link (better on small screens)
    nav.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", function () {
        setOpen(false);
      });
    });
  }

  /**
   * Active nav highlighting
   * Each primary link can carry data-nav="home|services|about|careers|contact".
   * The <body> sets data-page to the same token so we avoid brittle path parsing
   * across nested folders (services/fiber.html still highlights Services).
   */
  function initActiveNav() {
    var page = document.body.getAttribute("data-page");
    if (!page) return;

    document.querySelectorAll(".nav-primary__list a[data-nav]").forEach(function (link) {
      if (link.getAttribute("data-nav") === page) {
        link.setAttribute("aria-current", "page");
      }
    });
  }

  /**
   * Sticky header treatment on scroll (landing uses stronger blur via CSS).
   */
  function initHeaderScroll() {
    var header = document.querySelector(".site-header");
    if (!header) return;

    function update() {
      header.classList.toggle("is-scrolled", window.scrollY > 24);
    }

    update();
    window.addEventListener("scroll", update, { passive: true });
  }

  document.addEventListener("DOMContentLoaded", function () {
    initMobileNav();
    initActiveNav();
    initHeaderScroll();
  });
})();
