/**
 * showcase.js — Shared runtime for the Fable 5 showcase
 * ---------------------------------------------------------------------------
 * Exposes `window.Fable` (tiny utility namespace used by the demo scripts)
 * and wires page-level behaviour:
 *   - header state, scroll progress, mobile nav, scroll-spy
 *   - reveal-on-scroll and hero entrance
 *   - hero particle field (canvas, pointer-reactive, pauses off-screen)
 *   - typewriter ticker + count-up stats
 *   - pointer spotlight on cards
 *   - command palette (⌘K / Ctrl+K)
 */

(function () {
  "use strict";

  /* ------------------------------------------------------------------ */
  /* Utilities                                                          */
  /* ------------------------------------------------------------------ */

  var motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

  function reducedMotion() {
    return motionQuery.matches;
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function sleep(ms) {
    return new Promise(function (resolve) {
      setTimeout(resolve, ms);
    });
  }

  function rand(min, max) {
    return min + Math.random() * (max - min);
  }

  /**
   * Run token: lets long async demo sequences be cancelled/restarted
   * without racing each other.
   */
  function createRun() {
    var run = { cancelled: false };
    run.cancel = function () {
      run.cancelled = true;
    };
    run.wait = function (ms) {
      return sleep(ms).then(function () {
        if (run.cancelled) throw new Error("cancelled");
      });
    };
    return run;
  }

  /** Observe once; resolves callback the first time `el` is ≥ threshold visible. */
  function onVisible(el, callback, threshold) {
    if (!el) return;
    if (!("IntersectionObserver" in window)) {
      callback();
      return;
    }
    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            io.unobserve(entry.target);
            callback();
          }
        });
      },
      { threshold: threshold == null ? 0.25 : threshold }
    );
    io.observe(el);
  }

  /**
   * Streams `text` into `el` in small token-like chunks.
   * Returns a promise; honours `run.cancelled`.
   */
  function stream(el, text, opts) {
    opts = opts || {};
    var run = opts.run || createRun();
    var speed = opts.speed || 18;
    var render = opts.render || function (s) { el.textContent = s; };
    if (reducedMotion() || opts.instant) {
      render(text);
      return Promise.resolve();
    }
    var i = 0;
    return new Promise(function (resolve, reject) {
      function tick() {
        if (run.cancelled) return reject(new Error("cancelled"));
        var chunk = Math.random() < 0.15 ? 1 : Math.ceil(rand(1, 3));
        i = Math.min(text.length, i + chunk);
        render(text.slice(0, i));
        if (opts.onProgress) opts.onProgress(i, text.length);
        if (i >= text.length) return resolve();
        var pause = text[i - 1] === "\n" ? speed * 4 : speed * rand(0.6, 1.5);
        setTimeout(tick, pause);
      }
      tick();
    });
  }

  /* Minimal regex-based syntax highlighter (ts / py / sql / json / html). */
  var KEYWORDS = {
    ts: "import export from const let var function return if else for of in new class interface type extends implements async await throw try catch finally default true false null undefined this typeof as readonly private public static void",
    py: "def return if elif else for in while import from as class with async await yield lambda try except finally raise pass None True False not and or is",
    sql: "select from where with as group by order having join left inner on count sum avg date_trunc interval and or not in case when then else end desc asc limit over partition",
    json: "true false null",
    html: ""
  };

  function highlight(code, lang) {
    lang = lang || "ts";
    if (lang === "html") return highlightHtml(code);
    var kw = KEYWORDS[lang] ? KEYWORDS[lang].split(" ") : [];
    var kwSet = {};
    kw.forEach(function (k) { kwSet[k.toLowerCase()] = true; });

    var re;
    if (lang === "py") {
      re = /(#.*$)|("""[\s\S]*?"""|f?"(?:\\.|[^"\\])*"|f?'(?:\\.|[^'\\])*')|(\b\d+(?:\.\d+)?\b)|(\b[A-Za-z_]\w*)(?=\()|(\b[A-Z][A-Za-z0-9_]*\b)|(\b[A-Za-z_]\w*\b)|([{}()[\],.;:=<>+\-*/%!|&?]+)/gm;
    } else if (lang === "sql") {
      re = /(--.*$)|('(?:''|[^'])*')|(\b\d+(?:\.\d+)?\b)|(\b[A-Za-z_]\w*)(?=\()|(\b[A-Z][A-Za-z0-9_]*\b)|(\b[A-Za-z_]\w*\b)|([{}()[\],.;:=<>+\-*/%!|&?]+)/gm;
    } else if (lang === "json") {
      re = /(\/\/.*$)|("(?:\\.|[^"\\])*")(?=\s*:)|("(?:\\.|[^"\\])*")|(-?\b\d+(?:\.\d+)?\b)|(\btrue\b|\bfalse\b|\bnull\b)|([{}[\],:])/gm;
    } else {
      re = /(\/\/.*$|\/\*[\s\S]*?\*\/)|(`(?:\\.|[^`\\])*`|"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*')|(\b\d+(?:\.\d+)?\b)|(\b[A-Za-z_$][\w$]*)(?=\()|(\b[A-Z][A-Za-z0-9_]*\b)|(\b[A-Za-z_$][\w$]*\b)|([{}()[\],.;:=<>+\-*/%!|&?]+)/gm;
    }

    var out = "";
    var last = 0;
    var m;
    while ((m = re.exec(code)) !== null) {
      out += escapeHtml(code.slice(last, m.index));
      var t = m[0];
      var cls = "";
      if (lang === "json") {
        if (m[1]) cls = "tok-cm";
        else if (m[2]) cls = "tok-key";
        else if (m[3]) cls = "tok-str";
        else if (m[4]) cls = "tok-num";
        else if (m[5]) cls = "tok-kw";
        else if (m[6]) cls = "tok-punc";
      } else {
        if (m[1]) cls = "tok-cm";
        else if (m[2]) cls = "tok-str";
        else if (m[3]) cls = "tok-num";
        else if (m[4]) cls = kwSet[t.toLowerCase()] ? "tok-kw" : "tok-fn";
        else if (m[5]) cls = kwSet[t.toLowerCase()] ? "tok-kw" : "tok-type";
        else if (m[6]) cls = kwSet[t.toLowerCase()] ? "tok-kw" : "";
        else if (m[7]) cls = "tok-punc";
      }
      out += cls ? '<span class="' + cls + '">' + escapeHtml(t) + "</span>" : escapeHtml(t);
      last = re.lastIndex;
    }
    out += escapeHtml(code.slice(last));
    return out;
  }

  function highlightHtml(code) {
    var re = /(<!--[\s\S]*?-->)|(<\/?)([a-zA-Z][\w-]*)|([a-zA-Z-:]+)(=)("[^"]*")|(\/?>)/g;
    var out = "";
    var last = 0;
    var m;
    while ((m = re.exec(code)) !== null) {
      out += escapeHtml(code.slice(last, m.index));
      if (m[1]) out += '<span class="tok-cm">' + escapeHtml(m[1]) + "</span>";
      else if (m[2]) out += '<span class="tok-punc">' + escapeHtml(m[2]) + '</span><span class="tok-type">' + escapeHtml(m[3]) + "</span>";
      else if (m[4]) out += '<span class="tok-key">' + escapeHtml(m[4]) + '</span><span class="tok-punc">=</span><span class="tok-str">' + escapeHtml(m[6]) + "</span>";
      else if (m[7]) out += '<span class="tok-punc">' + escapeHtml(m[7]) + "</span>";
      last = re.lastIndex;
    }
    out += escapeHtml(code.slice(last));
    return out;
  }

  window.Fable = {
    reducedMotion: reducedMotion,
    escapeHtml: escapeHtml,
    sleep: sleep,
    rand: rand,
    createRun: createRun,
    onVisible: onVisible,
    stream: stream,
    highlight: highlight,
    actions: {} // demos register replay hooks here for the command palette
  };

  /* ------------------------------------------------------------------ */
  /* Chrome                                                             */
  /* ------------------------------------------------------------------ */

  function initHeader() {
    var header = document.querySelector(".site-header");
    var progress = document.querySelector(".scroll-progress");
    if (!header) return;
    var ticking = false;

    function update() {
      ticking = false;
      var y = window.scrollY;
      header.classList.toggle("is-scrolled", y > 16);
      if (progress) {
        var max = document.documentElement.scrollHeight - window.innerHeight;
        progress.style.transform = "scaleX(" + (max > 0 ? Math.min(1, y / max) : 0) + ")";
      }
    }

    window.addEventListener("scroll", function () {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(update);
      }
    }, { passive: true });
    update();
  }

  function initMobileNav() {
    var toggle = document.querySelector(".nav-toggle");
    var nav = document.querySelector(".nav");
    if (!toggle || !nav) return;

    function setOpen(open) {
      nav.classList.toggle("is-open", open);
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
    }

    toggle.addEventListener("click", function () {
      setOpen(!nav.classList.contains("is-open"));
    });
    nav.querySelectorAll("a").forEach(function (a) {
      a.addEventListener("click", function () { setOpen(false); });
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") setOpen(false);
    });
  }

  function initScrollSpy() {
    var links = Array.prototype.slice.call(document.querySelectorAll("[data-spy]"));
    if (!links.length) return;
    var targets = links.map(function (l) {
      return { link: l, el: document.getElementById(l.getAttribute("data-spy")) };
    }).filter(function (t) { return t.el; });
    var ticking = false;

    // Active = the last section whose top has crossed the upper third of the
    // viewport. Works for short sections that never fill a fixed band.
    function update() {
      ticking = false;
      var line = window.innerHeight * 0.34;
      var active = null;
      targets.forEach(function (t) {
        if (t.el.getBoundingClientRect().top <= line) active = t;
      });
      var atEnd = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2;
      if (atEnd) active = targets[targets.length - 1];
      targets.forEach(function (t) { t.link.classList.toggle("is-active", t === active); });
    }

    window.addEventListener("scroll", function () {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(update);
      }
    }, { passive: true });
    window.addEventListener("resize", update);
    update();
  }

  function initReveal() {
    var els = document.querySelectorAll(".reveal");
    if (!els.length) return;
    if (reducedMotion() || !("IntersectionObserver" in window)) {
      els.forEach(function (el) { el.classList.add("is-in"); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-in");
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -6% 0px" });
    els.forEach(function (el) { io.observe(el); });
  }

  function initHeroEnter() {
    var hero = document.querySelector(".hero");
    if (!hero) return;
    requestAnimationFrame(function () {
      requestAnimationFrame(function () { hero.classList.add("is-ready"); });
    });
  }

  /* ------------------------------------------------------------------ */
  /* Hero particle field                                                */
  /* ------------------------------------------------------------------ */

  function initField() {
    var canvas = document.getElementById("hero-field");
    if (!canvas) return;
    var ctx = canvas.getContext("2d");
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var w = 0, h = 0, nodes = [], raf = 0, running = false;
    var pointer = { x: -9999, y: -9999, active: false };
    var hues = ["139,124,255", "79,232,255", "255,111,181"];

    function resize() {
      var rect = canvas.getBoundingClientRect();
      w = rect.width;
      h = rect.height;
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      seed();
    }

    function seed() {
      var count = Math.round(Math.min(150, Math.max(50, (w * h) / 14000)));
      nodes = [];
      for (var i = 0; i < count; i++) {
        nodes.push({
          x: Math.random() * w,
          y: Math.random() * h,
          vx: rand(-0.18, 0.18),
          vy: rand(-0.12, 0.12),
          r: rand(0.8, 2.2),
          hue: hues[i % hues.length],
          phase: Math.random() * Math.PI * 2
        });
      }
    }

    function frame(t) {
      ctx.clearRect(0, 0, w, h);
      var linkDist = Math.min(150, w / 7);
      var i, j, a, b;

      for (i = 0; i < nodes.length; i++) {
        a = nodes[i];
        a.x += a.vx;
        a.y += a.vy;
        if (pointer.active) {
          var dx = a.x - pointer.x, dy = a.y - pointer.y;
          var d2 = dx * dx + dy * dy;
          if (d2 < 32000) {
            var f = (32000 - d2) / 32000;
            a.x += dx * f * 0.02;
            a.y += dy * f * 0.02;
          }
        }
        if (a.x < -20) a.x = w + 20; else if (a.x > w + 20) a.x = -20;
        if (a.y < -20) a.y = h + 20; else if (a.y > h + 20) a.y = -20;
      }

      ctx.lineWidth = 1;
      for (i = 0; i < nodes.length; i++) {
        a = nodes[i];
        for (j = i + 1; j < nodes.length; j++) {
          b = nodes[j];
          var ddx = a.x - b.x, ddy = a.y - b.y;
          var dist = Math.sqrt(ddx * ddx + ddy * ddy);
          if (dist < linkDist) {
            var alpha = (1 - dist / linkDist) * 0.28;
            ctx.strokeStyle = "rgba(" + a.hue + "," + alpha.toFixed(3) + ")";
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
          }
        }
      }

      for (i = 0; i < nodes.length; i++) {
        a = nodes[i];
        var pulse = 0.55 + 0.45 * Math.sin(t / 900 + a.phase);
        ctx.fillStyle = "rgba(" + a.hue + "," + (0.35 + pulse * 0.5).toFixed(3) + ")";
        ctx.beginPath();
        ctx.arc(a.x, a.y, a.r * (0.8 + pulse * 0.4), 0, Math.PI * 2);
        ctx.fill();
      }

      if (running) raf = requestAnimationFrame(frame);
    }

    function start() {
      if (running || reducedMotion()) return;
      running = true;
      raf = requestAnimationFrame(frame);
    }

    function stop() {
      running = false;
      cancelAnimationFrame(raf);
    }

    resize();
    window.addEventListener("resize", resize);

    if (reducedMotion()) {
      frame(0);
    } else {
      var hero = canvas.parentElement;
      if ("IntersectionObserver" in window) {
        new IntersectionObserver(function (entries) {
          entries[0].isIntersecting ? start() : stop();
        }, { threshold: 0.05 }).observe(hero);
      } else {
        start();
      }
      document.addEventListener("visibilitychange", function () {
        document.hidden ? stop() : start();
      });
      hero.addEventListener("pointermove", function (e) {
        var rect = canvas.getBoundingClientRect();
        pointer.x = e.clientX - rect.left;
        pointer.y = e.clientY - rect.top;
        pointer.active = true;
      });
      hero.addEventListener("pointerleave", function () {
        pointer.active = false;
      });
    }
  }

  /* ------------------------------------------------------------------ */
  /* Ticker + count-up                                                  */
  /* ------------------------------------------------------------------ */

  function initTicker() {
    var el = document.getElementById("ticker-text");
    if (!el) return;
    var lines = [
      "refactoring a 40-file TypeScript service without breaking the public API",
      "reading a 900-page contract in a single pass and flagging six risky clauses",
      "describing a photo of Kyrenia harbour, down to the boat registrations",
      "translating a support ticket into Greek, Turkish, and Russian at once",
      "opening a pull request with passing tests, unattended",
      "turning a napkin sketch into a responsive, accessible layout"
    ];
    if (reducedMotion()) {
      el.textContent = lines[0];
      return;
    }
    var idx = 0;
    function cycle() {
      var text = lines[idx % lines.length];
      idx++;
      stream(el, text, { speed: 24 }).then(function () {
        return sleep(2200);
      }).then(function () {
        return eraseTo(el, 0);
      }).then(cycle);
    }
    function eraseTo(node, target) {
      return new Promise(function (resolve) {
        (function step() {
          var cur = node.textContent;
          if (cur.length <= target) return resolve();
          node.textContent = cur.slice(0, Math.max(target, cur.length - 3));
          setTimeout(step, 12);
        })();
      });
    }
    cycle();
  }

  function initCounters() {
    var els = document.querySelectorAll("[data-count]");
    els.forEach(function (el) {
      var target = parseFloat(el.getAttribute("data-count"));
      var decimals = parseInt(el.getAttribute("data-decimals") || "0", 10);
      onVisible(el, function () {
        if (reducedMotion()) {
          el.textContent = target.toFixed(decimals);
          return;
        }
        var start = performance.now();
        var dur = 1400;
        (function tick(now) {
          var p = Math.min(1, (now - start) / dur);
          var eased = 1 - Math.pow(1 - p, 3);
          el.textContent = (target * eased).toFixed(decimals);
          if (p < 1) requestAnimationFrame(tick);
        })(start);
      }, 0.5);
    });
  }

  /* ------------------------------------------------------------------ */
  /* Card spotlight                                                     */
  /* ------------------------------------------------------------------ */

  function initSpotlight() {
    if (window.matchMedia("(hover: none)").matches) return;
    document.querySelectorAll("[data-spotlight]").forEach(function (card) {
      card.addEventListener("pointermove", function (e) {
        var rect = card.getBoundingClientRect();
        card.style.setProperty("--mx", (e.clientX - rect.left) + "px");
        card.style.setProperty("--my", (e.clientY - rect.top) + "px");
      });
    });
  }

  /* ------------------------------------------------------------------ */
  /* Command palette                                                    */
  /* ------------------------------------------------------------------ */

  function initPalette() {
    var root = document.getElementById("palette");
    var input = document.getElementById("palette-input");
    var list = document.getElementById("palette-list");
    if (!root || !input || !list) return;

    var lastFocus = null;
    var selected = 0;
    var filtered = [];

    function commands() {
      var base = [
        { label: "Go to Skills", hint: "section", run: function () { jump("#skills"); } },
        { label: "Go to Playground", hint: "section", run: function () { jump("#playground"); } },
        { label: "Go to Agent run", hint: "section", run: function () { jump("#agent"); } },
        { label: "Go to Benchmarks", hint: "section", run: function () { jump("#benchmarks"); } },
        { label: "Go to Case study", hint: "section", run: function () { jump("#case-study"); } },
        { label: "Open Cyprus Communications site", hint: "link", run: function () { window.location.href = "cyprus-communications/index.html"; } }
      ];
      Object.keys(window.Fable.actions).forEach(function (key) {
        var a = window.Fable.actions[key];
        base.push({ label: a.label, hint: a.hint || "demo", run: a.run });
      });
      return base;
    }

    function jump(hash) {
      var el = document.querySelector(hash);
      if (el) el.scrollIntoView({ behavior: reducedMotion() ? "auto" : "smooth", block: "start" });
      history.replaceState(null, "", hash);
    }

    function render() {
      var q = input.value.trim().toLowerCase();
      filtered = commands().filter(function (c) {
        return !q || c.label.toLowerCase().indexOf(q) !== -1 || (c.hint || "").indexOf(q) !== -1;
      });
      selected = Math.min(selected, Math.max(0, filtered.length - 1));
      if (!filtered.length) {
        list.innerHTML = '<li class="palette__empty">No matches.</li>';
        return;
      }
      list.innerHTML = filtered.map(function (c, i) {
        return '<li role="option" aria-selected="' + (i === selected) + '"><button class="palette__item" type="button" data-i="' + i + '" aria-selected="' + (i === selected) + '">' +
          '<span>' + escapeHtml(c.label) + '</span><span class="tag">' + escapeHtml(c.hint) + '</span></button></li>';
      }).join("");
    }

    function open() {
      lastFocus = document.activeElement;
      root.hidden = false;
      root.classList.add("is-open");
      input.value = "";
      selected = 0;
      render();
      input.focus();
      document.body.style.overflow = "hidden";
    }

    function close() {
      root.classList.remove("is-open");
      root.hidden = true;
      document.body.style.overflow = "";
      if (lastFocus && lastFocus.focus) lastFocus.focus();
    }

    function choose(i) {
      var c = filtered[i];
      if (!c) return;
      close();
      c.run();
    }

    document.querySelectorAll("[data-palette-open]").forEach(function (b) {
      b.addEventListener("click", open);
    });

    document.addEventListener("keydown", function (e) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        root.hidden ? open() : close();
      } else if (e.key === "Escape" && !root.hidden) {
        close();
      }
    });

    root.addEventListener("click", function (e) {
      if (e.target === root) close();
      var btn = e.target.closest(".palette__item");
      if (btn) choose(parseInt(btn.getAttribute("data-i"), 10));
    });

    input.addEventListener("input", function () {
      selected = 0;
      render();
    });

    input.addEventListener("keydown", function (e) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        selected = (selected + 1) % Math.max(1, filtered.length);
        render();
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        selected = (selected - 1 + filtered.length) % Math.max(1, filtered.length);
        render();
      } else if (e.key === "Enter") {
        e.preventDefault();
        choose(selected);
      }
    });
  }

  /* ------------------------------------------------------------------ */

  document.addEventListener("DOMContentLoaded", function () {
    initHeader();
    initMobileNav();
    initScrollSpy();
    initReveal();
    initHeroEnter();
    initField();
    initTicker();
    initCounters();
    initSpotlight();
    initPalette();
  });
})();
