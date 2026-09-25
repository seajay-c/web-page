/**
 * skills.js — The seven bento demos on the Skills section
 * ---------------------------------------------------------------------------
 *   1. Code stream      — multi-language streaming with syntax highlighting
 *   2. Reasoning trace  — step-by-step activation with a final answer
 *   3. Vision           — scan sweep, grounded detections, streamed caption
 *   4. Structured out   — JSON extraction with source-span highlighting
 *   5. Multilingual     — rotating translations (incl. RTL)
 *   6. Long context     — needle-in-a-haystack sweep
 *   7. Speed gauge      — live tokens/s sparkline
 *
 * Every demo starts when it scrolls into view and exposes a replay hook
 * through `Fable.actions` so the command palette can trigger it.
 */

(function () {
  "use strict";

  var F = window.Fable;
  if (!F) return;

  /* ------------------------------------------------------------------ */
  /* 1. Code stream                                                     */
  /* ------------------------------------------------------------------ */

  var SAMPLES = {
    ts: {
      lang: "ts",
      code: [
        "// Sliding-window limiter keyed by client id.",
        "// Safe across workers: state lives in Redis, not memory.",
        'import type { Redis } from "ioredis";',
        "",
        "export interface Limit { max: number; windowMs: number }",
        "",
        "export async function allow(",
        "  redis: Redis,",
        "  key: string,",
        "  { max, windowMs }: Limit,",
        "): Promise<{ ok: boolean; retryAfterMs: number }> {",
        "  const now = Date.now();",
        "  const bucket = `rl:${key}`;",
        "  const [, , count] = await redis",
        "    .multi()",
        "    .zremrangebyscore(bucket, 0, now - windowMs)",
        "    .zadd(bucket, now, `${now}-${Math.random()}`)",
        "    .zcard(bucket)",
        "    .pexpire(bucket, windowMs)",
        "    .exec()",
        "    .then((rows) => rows!.map(([, value]) => value as number));",
        "",
        "  const ok = count <= max;",
        "  return { ok, retryAfterMs: ok ? 0 : windowMs };",
        "}"
      ].join("\n")
    },
    py: {
      lang: "py",
      code: [
        '"""Incremental ETL: only re-process partitions whose bytes changed."""',
        "from __future__ import annotations",
        "",
        "import hashlib",
        "from dataclasses import dataclass",
        "from pathlib import Path",
        "",
        "",
        "@dataclass(frozen=True)",
        "class Partition:",
        "    day: str",
        "    path: Path",
        "",
        "    def checksum(self) -> str:",
        "        h = hashlib.blake2b(digest_size=16)",
        '        with self.path.open("rb") as f:',
        '            for chunk in iter(lambda: f.read(1 << 20), b""):',
        "                h.update(chunk)",
        "        return h.hexdigest()",
        "",
        "",
        "def plan(parts: list[Partition], state: dict[str, str]) -> list[Partition]:",
        '    """Return partitions whose data changed since the last successful run."""',
        "    return [p for p in parts if state.get(p.day) != p.checksum()]"
      ].join("\n")
    },
    sql: {
      lang: "sql",
      code: [
        "-- Weekly retention cohorts for fiber subscribers",
        "with first_seen as (",
        "  select customer_id,",
        "         date_trunc('week', min(activated_at)) as cohort",
        "  from subscriptions",
        "  group by customer_id",
        "),",
        "activity as (",
        "  select s.customer_id, date_trunc('week', u.used_at) as week",
        "  from usage u",
        "  join subscriptions s on s.id = u.subscription_id",
        ")",
        "select",
        "  f.cohort,",
        "  (a.week - f.cohort) / interval '7 days'            as week_n,",
        "  count(distinct a.customer_id)::float",
        "    / count(distinct f.customer_id) over (partition by f.cohort) as retained",
        "from first_seen f",
        "join activity a using (customer_id)",
        "group by 1, 2",
        "order by 1, 2;"
      ].join("\n")
    }
  };

  function initCodeStream() {
    var pre = document.getElementById("code-stream");
    var meta = document.getElementById("code-meta");
    var tabs = document.querySelectorAll("[data-code-tab]");
    var replay = document.querySelector("[data-code-replay]");
    if (!pre) return;

    var order = ["ts", "py", "sql"];
    var current = "ts";
    var run = null;
    var started = false;

    function setTab(key) {
      tabs.forEach(function (t) {
        var on = t.getAttribute("data-code-tab") === key;
        t.classList.toggle("is-active", on);
        t.setAttribute("aria-selected", on ? "true" : "false");
      });
    }

    function play(key, loop) {
      if (run) run.cancel();
      run = F.createRun();
      var mine = run;
      current = key;
      setTab(key);
      var sample = SAMPLES[key];
      pre.innerHTML = "";
      meta.textContent = "0 tokens";

      F.stream(pre, sample.code, {
        run: mine,
        speed: 14,
        render: function (partial) {
          pre.innerHTML = F.highlight(partial, sample.lang) + '<span class="caret" aria-hidden="true"></span>';
          pre.scrollTop = pre.scrollHeight;
        },
        onProgress: function (i) {
          meta.textContent = Math.round(i / 3.6) + " tokens";
        }
      }).then(function () {
        pre.innerHTML = F.highlight(sample.code, sample.lang);
        meta.textContent = Math.round(sample.code.length / 3.6) + " tokens · done";
        if (!loop || F.reducedMotion()) return;
        return mine.wait(3600).then(function () {
          var next = order[(order.indexOf(key) + 1) % order.length];
          play(next, true);
        });
      }).catch(function () { /* cancelled */ });
    }

    tabs.forEach(function (t) {
      t.addEventListener("click", function () {
        play(t.getAttribute("data-code-tab"), true);
      });
    });
    if (replay) replay.addEventListener("click", function () { play(current, true); });

    F.onVisible(pre, function () {
      if (started) return;
      started = true;
      play("ts", true);
    });

    F.actions.code = { label: "Replay code stream", hint: "skills", run: function () {
      document.getElementById("skills").scrollIntoView({ behavior: "smooth" });
      play(current, true);
    } };
  }

  /* ------------------------------------------------------------------ */
  /* 2. Reasoning trace                                                 */
  /* ------------------------------------------------------------------ */

  function initTrace() {
    var list = document.getElementById("trace");
    var answer = document.getElementById("trace-answer");
    var replay = document.querySelector("[data-trace-replay]");
    if (!list) return;
    var steps = Array.prototype.slice.call(list.querySelectorAll(".trace__step"));
    var run = null;

    function reset() {
      steps.forEach(function (s) { s.classList.remove("is-active", "is-done"); });
      answer.classList.remove("is-shown");
    }

    function play() {
      if (run) run.cancel();
      run = F.createRun();
      var mine = run;
      reset();
      if (F.reducedMotion()) {
        steps.forEach(function (s) { s.classList.add("is-done"); });
        answer.classList.add("is-shown");
        return;
      }
      var p = mine.wait(300);
      steps.forEach(function (step, i) {
        p = p.then(function () {
          if (i > 0) {
            steps[i - 1].classList.remove("is-active");
            steps[i - 1].classList.add("is-done");
          }
          step.classList.add("is-active");
          return mine.wait(1500);
        });
      });
      p.then(function () {
        steps[steps.length - 1].classList.remove("is-active");
        steps[steps.length - 1].classList.add("is-done");
        answer.classList.add("is-shown");
      }).catch(function () { /* cancelled */ });
    }

    if (replay) replay.addEventListener("click", play);
    F.onVisible(list, play, 0.4);
    F.actions.trace = { label: "Replay reasoning trace", hint: "skills", run: function () {
      list.scrollIntoView({ behavior: "smooth", block: "center" });
      play();
    } };
  }

  /* ------------------------------------------------------------------ */
  /* 3. Vision                                                          */
  /* ------------------------------------------------------------------ */

  function initVision() {
    var frame = document.getElementById("vision-frame");
    var caption = document.getElementById("vision-caption");
    var replay = document.querySelector("[data-vision-replay]");
    if (!frame) return;
    var dets = Array.prototype.slice.call(frame.querySelectorAll(".det"));
    var text = "A calm harbour at golden hour. A crenellated stone castle anchors the right of the frame above a long pier; two boats ride at anchor in the foreground while gulls cross a low sun. Most likely Kyrenia, on the north coast of Cyprus.";
    var run = null;

    function play() {
      if (run) run.cancel();
      run = F.createRun();
      var mine = run;
      dets.forEach(function (d) { d.classList.remove("is-on"); });
      caption.textContent = "";
      frame.classList.remove("is-scanning");
      void frame.offsetWidth;

      if (F.reducedMotion()) {
        dets.forEach(function (d) { d.classList.add("is-on"); });
        caption.textContent = text;
        return;
      }

      frame.classList.add("is-scanning");
      mine.wait(1300).then(function () {
        var p = Promise.resolve();
        dets.forEach(function (d) {
          p = p.then(function () {
            d.classList.add("is-on");
            return mine.wait(260);
          });
        });
        return p;
      }).then(function () {
        return F.stream(caption, text, {
          run: mine,
          speed: 12,
          render: function (partial) {
            caption.innerHTML = F.escapeHtml(partial) + '<span class="caret" aria-hidden="true"></span>';
          }
        });
      }).then(function () {
        caption.textContent = text;
      }).catch(function () { /* cancelled */ });
    }

    if (replay) replay.addEventListener("click", play);
    F.onVisible(frame, play, 0.4);
    F.actions.vision = { label: "Replay vision analysis", hint: "skills", run: function () {
      frame.scrollIntoView({ behavior: "smooth", block: "center" });
      play();
    } };
  }

  /* ------------------------------------------------------------------ */
  /* 4. Structured output                                               */
  /* ------------------------------------------------------------------ */

  function initJson() {
    var out = document.getElementById("json-out");
    var status = document.getElementById("json-status");
    var source = document.getElementById("json-source");
    var replay = document.querySelector("[data-json-replay]");
    if (!out) return;

    var json = [
      "{",
      '  "customer": {',
      '    "name": "Eleni Christou",',
      '    "company": "Troodos Bakery",',
      '    "phone": "+357 99 123 456"',
      "  },",
      '  "product": "Business Connect 500",',
      '  "location": "Platres",',
      '  "issue": "intermittent_drops",',
      '  "since": "2026-09-22T08:00:00+03:00",',
      '  "impact": "blocking card payments",',
      '  "priority": "P1",',
      '  "confidence": 0.97',
      "}"
    ].join("\n");

    var fieldMap = { name: '"name"', company: '"company"', phone: '"phone"', product: '"product"', location: '"location"', since: '"since"', severity: '"impact"' };
    var marks = {};
    source.querySelectorAll("mark").forEach(function (m) { marks[m.getAttribute("data-f")] = m; });
    var run = null;

    function play() {
      if (run) run.cancel();
      run = F.createRun();
      var mine = run;
      Object.keys(marks).forEach(function (k) { marks[k].classList.remove("is-hit"); });
      out.innerHTML = "";
      status.textContent = "extracting";
      status.className = "tag tag--magenta";

      F.stream(out, json, {
        run: mine,
        speed: 16,
        render: function (partial) {
          out.innerHTML = F.highlight(partial, "json") + '<span class="caret" aria-hidden="true"></span>';
          Object.keys(fieldMap).forEach(function (k) {
            if (partial.indexOf(fieldMap[k]) !== -1) marks[k].classList.add("is-hit");
          });
        }
      }).then(function () {
        out.innerHTML = F.highlight(json, "json");
        status.textContent = "valid · schema ok";
        status.className = "tag tag--live";
        Object.keys(marks).forEach(function (k) { marks[k].classList.add("is-hit"); });
      }).catch(function () { /* cancelled */ });
    }

    if (replay) replay.addEventListener("click", play);
    F.onVisible(out, play, 0.4);
    F.actions.json = { label: "Replay JSON extraction", hint: "skills", run: function () {
      out.scrollIntoView({ behavior: "smooth", block: "center" });
      play();
    } };
  }

  /* ------------------------------------------------------------------ */
  /* 5. Multilingual                                                    */
  /* ------------------------------------------------------------------ */

  function initLang() {
    var text = document.getElementById("lang-text");
    var code = document.getElementById("lang-code");
    var name = document.getElementById("lang-name");
    var dots = document.getElementById("lang-dots");
    if (!text) return;

    var items = [
      { code: "EN", name: "English", lang: "en", t: "Your connection is back online. Sorry for the interruption." },
      { code: "EL", name: "Greek", lang: "el", t: "Η σύνδεσή σας αποκαταστάθηκε. Ζητούμε συγγνώμη για τη διακοπή." },
      { code: "TR", name: "Turkish", lang: "tr", t: "Bağlantınız yeniden aktif. Kesinti için özür dileriz." },
      { code: "JA", name: "Japanese", lang: "ja", t: "接続が復旧しました。ご不便をおかけして申し訳ありません。" },
      { code: "AR", name: "Arabic", lang: "ar", dir: "rtl", t: "عاد اتصالك إلى العمل. نعتذر عن الانقطاع." },
      { code: "DE", name: "German", lang: "de", t: "Ihre Verbindung ist wieder online. Entschuldigung für die Unterbrechung." },
      { code: "HI", name: "Hindi", lang: "hi", t: "आपका कनेक्शन फिर से चालू है। असुविधा के लिए खेद है।" },
      { code: "PT", name: "Portuguese", lang: "pt-BR", t: "Sua conexão voltou a funcionar. Desculpe pela interrupção." },
      { code: "KO", name: "Korean", lang: "ko", t: "연결이 복구되었습니다. 불편을 드려 죄송합니다." }
    ];

    dots.innerHTML = items.map(function () { return "<i></i>"; }).join("");
    var dotEls = dots.querySelectorAll("i");
    var idx = 0;

    function show(i) {
      var it = items[i];
      text.textContent = it.t;
      text.setAttribute("lang", it.lang);
      text.setAttribute("dir", it.dir || "ltr");
      code.textContent = it.code;
      name.textContent = it.name;
      dotEls.forEach(function (d, j) { d.classList.toggle("is-on", j === i); });
    }

    show(0);
    if (F.reducedMotion()) return;

    var timer = null;
    function start() {
      if (timer) return;
      timer = setInterval(function () {
        text.classList.add("is-out");
        setTimeout(function () {
          idx = (idx + 1) % items.length;
          show(idx);
          text.classList.remove("is-out");
        }, 320);
      }, 2800);
    }
    function stop() {
      clearInterval(timer);
      timer = null;
    }

    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (entries) {
        entries[0].isIntersecting ? start() : stop();
      }, { threshold: 0.2 }).observe(text);
    } else {
      start();
    }
  }

  /* ------------------------------------------------------------------ */
  /* 6. Long context                                                    */
  /* ------------------------------------------------------------------ */

  function initHaystack() {
    var doc = document.getElementById("haystack");
    var result = document.getElementById("haystack-result");
    var label = document.getElementById("haystack-label");
    var button = document.querySelector("[data-haystack-run]");
    if (!doc) return;

    var lines = [];
    var frag = document.createDocumentFragment();
    for (var i = 0; i < 168; i++) {
      var line = document.createElement("i");
      line.className = "hs-line";
      line.style.width = (45 + Math.random() * 55) + "%";
      frag.appendChild(line);
      lines.push(line);
    }
    doc.appendChild(frag);

    var run = null;

    function play() {
      if (run) run.cancel();
      run = F.createRun();
      var mine = run;
      lines.forEach(function (l) { l.classList.remove("is-needle"); });
      result.classList.remove("is-shown");
      doc.classList.remove("is-scanning");
      void doc.offsetWidth;
      label.textContent = "scanning 1,048,576 tokens…";

      var target = lines[Math.floor(Math.random() * lines.length)];
      var page = 40 + Math.floor(Math.random() * 2860);
      var ms = (0.31 + Math.random() * 0.3).toFixed(2);

      if (F.reducedMotion()) {
        target.classList.add("is-needle");
        finish(page, ms);
        return;
      }

      doc.classList.add("is-scanning");
      mine.wait(1500).then(function () {
        target.classList.add("is-needle");
        finish(page, ms);
      }).catch(function () { /* cancelled */ });
    }

    function finish(page, ms) {
      label.textContent = "1,048,576 tokens · 2,910 pages";
      result.innerHTML = "found · <b>page " + page + "</b> · " + ms + " s";
      result.classList.add("is-shown");
    }

    if (button) button.addEventListener("click", play);
    F.onVisible(doc, play, 0.4);
    F.actions.haystack = { label: "Run needle-in-a-haystack search", hint: "skills", run: function () {
      doc.scrollIntoView({ behavior: "smooth", block: "center" });
      play();
    } };
  }

  /* ------------------------------------------------------------------ */
  /* 7. Speed gauge                                                     */
  /* ------------------------------------------------------------------ */

  function initGauge() {
    var canvas = document.getElementById("gauge-spark");
    var value = document.getElementById("gauge-value");
    if (!canvas) return;
    var ctx = canvas.getContext("2d");
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var points = [];
    var N = 60;
    var shown = 0;
    var target = 142;
    var timer = null;
    var raf = 0;

    for (var i = 0; i < N; i++) points.push(138 + Math.sin(i / 4) * 5 + (Math.random() - 0.5) * 6);

    function resize() {
      var rect = canvas.getBoundingClientRect();
      canvas.width = Math.floor(rect.width * dpr);
      canvas.height = Math.floor(rect.height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      draw();
    }

    function draw() {
      var rect = canvas.getBoundingClientRect();
      var w = rect.width, h = rect.height;
      ctx.clearRect(0, 0, w, h);
      var min = 110, max = 170;
      var pad = 10;

      ctx.strokeStyle = "rgba(255,255,255,0.06)";
      ctx.lineWidth = 1;
      [130, 150].forEach(function (g) {
        var y = h - pad - ((g - min) / (max - min)) * (h - pad * 2);
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
      });

      var grad = ctx.createLinearGradient(0, 0, 0, h);
      grad.addColorStop(0, "rgba(79,232,255,0.35)");
      grad.addColorStop(1, "rgba(79,232,255,0)");

      ctx.beginPath();
      points.forEach(function (p, i) {
        var x = (i / (N - 1)) * w;
        var y = h - pad - ((p - min) / (max - min)) * (h - pad * 2);
        i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      });
      ctx.strokeStyle = "#4fe8ff";
      ctx.lineWidth = 1.8;
      ctx.lineJoin = "round";
      ctx.stroke();
      ctx.lineTo(w, h);
      ctx.lineTo(0, h);
      ctx.closePath();
      ctx.fillStyle = grad;
      ctx.fill();

      var lx = w, lp = points[N - 1];
      var ly = h - pad - ((lp - min) / (max - min)) * (h - pad * 2);
      ctx.fillStyle = "#4fe8ff";
      ctx.beginPath();
      ctx.arc(lx - 2, ly, 3, 0, Math.PI * 2);
      ctx.fill();
    }

    function tick() {
      var last = points[N - 1];
      var next = last + (target - last) * 0.25 + (Math.random() - 0.5) * 8;
      if (Math.random() < 0.08) target = 134 + Math.random() * 16;
      points.push(Math.max(115, Math.min(165, next)));
      points.shift();
      draw();
    }

    function animateNumber() {
      var goal = points[N - 1];
      shown += (goal - shown) * 0.12;
      value.textContent = Math.round(shown);
      raf = requestAnimationFrame(animateNumber);
    }

    function start() {
      if (timer) return;
      timer = setInterval(tick, 420);
      raf = requestAnimationFrame(animateNumber);
    }
    function stop() {
      clearInterval(timer);
      timer = null;
      cancelAnimationFrame(raf);
    }

    resize();
    window.addEventListener("resize", resize);

    if (F.reducedMotion()) {
      value.textContent = "142";
      return;
    }
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (entries) {
        entries[0].isIntersecting ? start() : stop();
      }, { threshold: 0.2 }).observe(canvas);
    } else {
      start();
    }
  }

  /* ------------------------------------------------------------------ */

  document.addEventListener("DOMContentLoaded", function () {
    initCodeStream();
    initTrace();
    initVision();
    initJson();
    initLang();
    initHaystack();
    initGauge();
  });
})();
