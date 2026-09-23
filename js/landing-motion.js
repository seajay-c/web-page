/**
 * landing-motion.js — Motion for index.html only
 * ---------------------------------------------------------------------------
 * Techniques used (educational):
 *   1. Hero ready-state: add .is-ready after first paint so CSS can fade/slide
 *      content in without FOUC fighting the animation.
 *   2. IntersectionObserver section reveals: when a .landing-section enters
 *      the viewport (~20% visible), add .is-visible to drive CSS transitions.
 *   3. prefers-reduced-motion: skip observers and force visible states so
 *      users who opt out of motion still get full content immediately.
 *
 * Never load this file on traditional subpages.
 */

(function () {
  "use strict";

  function prefersReducedMotion() {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }

  function revealAll(sections) {
    sections.forEach(function (section) {
      section.classList.add("is-visible");
    });
  }

  function initHero() {
    var hero = document.querySelector(".landing-hero");
    if (!hero) return;

    if (prefersReducedMotion()) {
      hero.classList.add("is-ready");
      return;
    }

    // Double rAF: wait until the browser has painted the initial (hidden) state
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        hero.classList.add("is-ready");
      });
    });
  }

  function initSectionReveals() {
    var sections = document.querySelectorAll(".landing-section");
    if (!sections.length) return;

    if (prefersReducedMotion() || !("IntersectionObserver" in window)) {
      revealAll(sections);
      return;
    }

    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.2, rootMargin: "0px 0px -8% 0px" }
    );

    sections.forEach(function (section) {
      observer.observe(section);
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    initHero();
    initSectionReveals();
  });
})();
