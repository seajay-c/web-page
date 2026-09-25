/**
 * skills.js — The seven bento demos on the Skills section
 * ---------------------------------------------------------------------------
 *   1. Code stream      — multi-language streaming with syntax highlighting
 *   2. Reasoning trace  — step-by-step activation with a final answer
 *   3. Vision           — scan sweep, grounded detections, streamed caption
 *   4. Structured out   — JSON extraction with source-span highlighting
 *   5. Multilingual     — rotating translations (incl. RTL)
 *   6. Long context     — needle-in-a-haystack sweep
 *   7. Response gauge   — live minutes-to-first-response sparkline
 *
 * Every demo starts when it scrolls into view and exposes a replay hook
 * through `Desk.actions` so the command palette can trigger it.
 */

(function () {
  "use strict";

  var F = window.Desk;
  if (!F) return;

  /* ------------------------------------------------------------------ */
  /* 1. Code stream                                                     */
  /* ------------------------------------------------------------------ */

  var SAMPLES = {
    ps: {
      lang: "ps",
      code: [
        "# Ticket 1842 — restore the Strovolos finance share.",
        "# Run from the on-call jump host. Do not reboot the firewall.",
        "param([string]$Site = 'Strovolos')",
        "",
        "$route = Get-VpnRoute -Site $Site -Prefix '10.4.0.0/16'",
        "if (-not $route) {",
        "  Add-VpnRoute -Site $Site -Prefix '10.4.0.0/16' -NextHop '10.4.0.1'",
        "  Write-Output 'split tunnel restored'",
        "} else {",
        "  Write-Output 'route already present'",
        "}",
        "",
        "Test-NetConnection 10.4.12.20 -Port 445 |",
        "  Select-Object ComputerName, TcpTestSucceeded"
      ].join("\n")
    },
    macro: {
      lang: "macro",
      code: [
        "# Desk macro — new incident from a client email",
        "ticket.priority = P1",
        "ticket.queue = on-call",
        "ticket.site = Strovolos",
        "ticket.impact = finance share unreachable",
        "ticket.contact = Eleni Christou",
        "ticket.phone = +357 99 123 456",
        "",
        "# Promise on the retainer",
        "ticket.response_minutes = 15",
        "notify.client = true",
        "page.oncall = true"
      ].join("\n")
    },
    sql: {
      lang: "sql",
      code: [
        "-- P1s still inside the 15-minute first-response window",
        "select",
        "  t.id,",
        "  t.site,",
        "  t.opened_at,",
        "  extract(epoch from (now() - t.opened_at)) / 60 as age_min",
        "from tickets t",
        "where t.priority = 'P1'",
        "  and t.first_response_at is null",
        "  and t.opened_at > now() - interval '15 minutes'",
        "order by t.opened_at;"
      ].join("\n")
    }
  };

  function initCodeStream() {
    var pre = document.getElementById("code-stream");
    var meta = document.getElementById("code-meta");
    var tabs = document.querySelectorAll("[data-code-tab]");
    var replay = document.querySelector("[data-code-replay]");
    if (!pre) return;

    var order = ["ps", "macro", "sql"];
    var current = "ps";
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
      meta.textContent = "0 lines";

      F.stream(pre, sample.code, {
        run: mine,
        speed: 14,
        render: function (partial) {
          pre.innerHTML = F.highlight(partial, sample.lang) + '<span class="caret" aria-hidden="true"></span>';
          pre.scrollTop = pre.scrollHeight;
        },
        onProgress: function (i) {
          meta.textContent = sample.code.slice(0, i).split("\n").length + " lines";
        }
      }).then(function () {
        pre.innerHTML = F.highlight(sample.code, sample.lang);
        meta.textContent = sample.code.split("\n").length + " lines · done";
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
      play("ps", true);
    });

    F.actions.code = { label: "Replay help-desk runbook", hint: "support", run: function () {
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
    F.actions.trace = { label: "Replay troubleshooting trace", hint: "support", run: function () {
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
    var text = "Commercial frontage on the Strovolos lateral. Pole P12 carries the span, a 4-way conduit runs the sidewalk to cabinet C3, and the permit notes 1.2 m clearance from the face of curb. Business entrance only.";
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
    F.actions.vision = { label: "Replay survey markup", hint: "support", run: function () {
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
      '  "product": "finance VPN",',
      '  "location": "Strovolos",',
      '  "issue": "share_unreachable",',
      '  "since": "2026-09-25T08:10:00+03:00",',
      '  "impact": "payroll cannot open the share",',
      '  "priority": "P1"',
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
      status.textContent = "reading";
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
        status.textContent = "ticket opened";
        status.className = "tag tag--live";
        Object.keys(marks).forEach(function (k) { marks[k].classList.add("is-hit"); });
      }).catch(function () { /* cancelled */ });
    }

    if (replay) replay.addEventListener("click", play);
    F.onVisible(out, play, 0.4);
    F.actions.json = { label: "Replay ticket capture", hint: "support", run: function () {
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
      { code: "EN", name: "English", lang: "en", t: "Access is restored. Your team can sign in again." },
      { code: "EL", name: "Greek", lang: "el", t: "Η πρόσβαση αποκαταστάθηκε. Η ομάδα σας μπορεί να συνδεθεί ξανά." },
      { code: "TR", name: "Turkish", lang: "tr", t: "Erişim yeniden açıldı. Ekibiniz tekrar giriş yapabilir." },
      { code: "JA", name: "Japanese", lang: "ja", t: "アクセスを復旧しました。チームは再度サインインできます。" },
      { code: "AR", name: "Arabic", lang: "ar", dir: "rtl", t: "تمت استعادة الوصول. يمكن لفريقكم تسجيل الدخول مرة أخرى." },
      { code: "DE", name: "German", lang: "de", t: "Der Zugriff ist wiederhergestellt. Ihr Team kann sich wieder anmelden." },
      { code: "HI", name: "Hindi", lang: "hi", t: "पहुँच बहाल हो गई है। आपकी टीम फिर से साइन इन कर सकती है।" },
      { code: "PT", name: "Portuguese", lang: "pt-BR", t: "O acesso foi restaurado. Sua equipe pode entrar de novo." },
      { code: "KO", name: "Korean", lang: "ko", t: "접속이 복구되었습니다. 팀이 다시 로그인할 수 있습니다." }
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
      label.textContent = "searching 1,284 articles…";

      var target = lines[Math.floor(Math.random() * lines.length)];
      var page = "KB-441 VPN split tunnel";
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
      label.textContent = "1,284 articles";
      result.innerHTML = "found · <b>" + page + "</b> · " + ms + " s";
      result.classList.add("is-shown");
    }

    if (button) button.addEventListener("click", play);
    F.onVisible(doc, play, 0.4);
    F.actions.haystack = { label: "Search the knowledge base", hint: "support", run: function () {
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
    var target = 7.4;
    var timer = null;
    var raf = 0;

    for (var i = 0; i < N; i++) points.push(7 + Math.sin(i / 4) * 1.2 + (Math.random() - 0.5) * 0.8);

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
      var min = 2, max = 16;
      var pad = 10;

      ctx.strokeStyle = "rgba(255,255,255,0.06)";
      ctx.lineWidth = 1;
      [8, 15].forEach(function (g) {
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
      var next = last + (target - last) * 0.25 + (Math.random() - 0.5) * 1.1;
      if (Math.random() < 0.08) target = 5.5 + Math.random() * 4;
      points.push(Math.max(3, Math.min(14, next)));
      points.shift();
      draw();
    }

    function animateNumber() {
      var goal = points[N - 1];
      shown += (goal - shown) * 0.12;
      value.textContent = shown.toFixed(1);
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
      value.textContent = "7.4";
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
