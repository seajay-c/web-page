/**
 * playground.js — Prompt → live UI demo
 * ---------------------------------------------------------------------------
 * The user picks (or types) a prompt. The "model" then:
 *   1. thinks (shimmer), 2. streams a short design rationale,
 *   3. streams the markup into the Code tab, 4. mounts a working preview.
 *
 * Templates are scripted fixtures matched by keyword. User-typed text is
 * only ever inserted as text (escaped), never as HTML.
 */

(function () {
  "use strict";

  var F = window.Desk;
  if (!F) return;

  /* ------------------------------------------------------------------ */
  /* Fixtures                                                           */
  /* ------------------------------------------------------------------ */

  function sparkPaths() {
    var data = [42, 47, 45, 52, 58, 56, 63, 69, 66, 74, 81, 88];
    var w = 360, h = 120, pad = 6;
    var min = 36, max = 92;
    var pts = data.map(function (v, i) {
      var x = pad + (i / (data.length - 1)) * (w - pad * 2);
      var y = h - pad - ((v - min) / (max - min)) * (h - pad * 2);
      return [x.toFixed(1), y.toFixed(1)];
    });
    var line = pts.map(function (p, i) { return (i ? "L" : "M") + p[0] + " " + p[1]; }).join(" ");
    var area = line + " L" + pts[pts.length - 1][0] + " " + h + " L" + pts[0][0] + " " + h + " Z";
    return { line: line, area: area, w: w, h: h };
  }

  var TEMPLATES = [
    {
      id: "pricing",
      keys: ["pricing", "price", "plan", "retainer", "managed"],
      title: "Managed plan",
      narration: "The retainer is the number a buyer compares, so it sits largest, with monthly and yearly beside the plan name. Yearly shows the effective monthly figure and what a full year saves. The list under it is the desk you actually get.",
      html: [
        '<article class="pg-pricing">',
        '  <div class="pg-pricing__top">',
        '    <span class="pg-pricing__name">Managed desk</span>',
        '    <div class="pg-pricing__toggle" role="group" aria-label="Billing period">',
        '      <button type="button" data-period="monthly" aria-pressed="true">Monthly</button>',
        '      <button type="button" data-period="yearly" aria-pressed="false">Yearly</button>',
        '    </div>',
        '  </div>',
        '  <p class="pg-pricing__price">€<span data-price>2400</span><small>/ month</small></p>',
        '  <p class="pg-pricing__save" data-save aria-live="polite"></p>',
        '  <ul>',
        '    <li>15-minute first response, 24/7</li>',
        '    <li>Microsoft 365, endpoints, backup</li>',
        '    <li>Monitoring that pages a person</li>',
        '    <li>Security reviews each quarter</li>',
        '  </ul>',
        '  <button class="pg-pricing__cta" type="button">Request this retainer</button>',
        '</article>'
      ].join("\n")
    },
    {
      id: "permit",
      keys: ["permit", "right-of-way", "right of way", "row", "lateral", "acropolis"],
      title: "Permit status",
      narration: "A permit card should answer where the package is, not how pretty the drawing looks. Four stages, one of them current, plus the clearance and the authority that has the file. This one is the Acropolis Ltd lateral.",
      html: [
        '<article class="pg-permit" aria-label="Permit 26-118 status">',
        '  <div class="pg-permit__top">',
        '    <span class="pg-permit__id">ROW-26-118</span>',
        '    <span class="pg-permit__badge">In review</span>',
        '  </div>',
        '  <h4>Acropolis Ltd lateral</h4>',
        '  <p>Strovolos · pole P12 to cabinet C3 · clearance 1.2 m</p>',
        '  <ol>',
        '    <li class="is-done">Survey filed</li>',
        '    <li class="is-done">3D route issued</li>',
        '    <li class="is-now">Roadway authority review</li>',
        '    <li>Build window</li>',
        '  </ol>',
        '</article>'
      ].join("\n")
    },
    {
      id: "signup",
      keys: ["signup", "sign up", "sign-up", "register", "form", "login", "portal", "password", "sign-in", "signin"],
      title: "Portal sign-in",
      narration: "Work email and a password, then one action. The desk checks the email shape and asks for eight characters before it will send a sign-in. The strength meter updates as the password is typed.",
      html: [
        '<form class="pg-form" novalidate data-pg-form>',
        '  <h4>Client portal</h4>',
        '  <p>Sign in to see your tickets and permit status.</p>',
        '  <label class="pg-field" data-field="email">',
        '    Email',
        '    <input type="email" name="email" placeholder="you@example.com" autocomplete="off" aria-describedby="pg-email-err">',
        '    <small id="pg-email-err" role="alert"></small>',
        '  </label>',
        '  <label class="pg-field" data-field="password">',
        '    Password',
        '    <input type="password" name="password" placeholder="At least 8 characters" aria-describedby="pg-pass-err">',
        '    <small id="pg-pass-err" role="alert"></small>',
        '  </label>',
        '  <div class="pg-strength" data-level="0" aria-hidden="true"><i></i><i></i><i></i><i></i></div>',
        '  <button type="submit">Sign in</button>',
        '</form>'
      ].join("\n")
    },
    {
      id: "kanban",
      keys: ["kanban", "board", "todo", "task", "drag", "ticket", "incident", "queue"],
      title: "Ticket board",
      narration: "Three columns for the live queue. Drag a ticket to move it. Counts update when it lands. Tags mark a P1, a request, or a change so the board is readable at a glance.",
      html: [
        '<div class="pg-kanban">',
        '  <section class="pg-col" data-col="todo" aria-label="To do">',
        '    <header class="pg-col__head"><span>Queue</span><span class="pg-col__count">3</span></header>',
        '    <article class="pg-task" draggable="true" id="pg-t1"><span class="pg-task__tag pg-task__tag--bug">P1</span>Finance share down · Strovolos</article>',
        '    <article class="pg-task" draggable="true" id="pg-t2"><span class="pg-task__tag pg-task__tag--feat">Request</span>New starter laptop</article>',
        '    <article class="pg-task" draggable="true" id="pg-t3"><span class="pg-task__tag pg-task__tag--docs">Change</span>Mailbox restore · finance</article>',
        '  </section>',
        '  <section class="pg-col" data-col="doing" aria-label="In progress">',
        '    <header class="pg-col__head"><span>On call</span><span class="pg-col__count">1</span></header>',
        '    <article class="pg-task" draggable="true" id="pg-t4"><span class="pg-task__tag pg-task__tag--bug">P1</span>VPN route restore · 1842</article>',
        '  </section>',
        '  <section class="pg-col" data-col="done" aria-label="Done">',
        '    <header class="pg-col__head"><span>Closed</span><span class="pg-col__count">1</span></header>',
        '    <article class="pg-task" draggable="true" id="pg-t5"><span class="pg-task__tag pg-task__tag--docs">Change</span>Backup job rerun · bakery</article>',
        '  </section>',
        '</div>'
      ].join("\n")
    },
    {
      id: "chart",
      keys: ["chart", "ticket", "tickets", "sparkline", "graph", "uptime", "trend", "closed"],
      title: "Ticket chart",
      narration: "One question: are we closing more than we open? The line is tickets closed each month. No axis clutter. The months mark the year the retainer has been running.",
      html: (function () {
        var p = sparkPaths();
        return [
          '<article class="pg-chart" aria-label="Tickets closed, last 12 months">',
          '  <div class="pg-chart__head">',
          '    <div>',
          '      <div class="pg-chart__title">Tickets closed</div>',
          '      <div class="pg-chart__value">88</div>',
          '    </div>',
          '    <span class="pg-chart__delta">this month</span>',
          '  </div>',
          '  <svg viewBox="0 0 ' + p.w + ' ' + p.h + '" role="img" aria-label="Tickets closed rising over twelve months">',
          '    <path class="area" d="' + p.area + '"/>',
          '    <path class="line" d="' + p.line + '"/>',
          '  </svg>',
          '  <div class="pg-chart__months"><span>Oct 25</span><span>Mar 26</span><span>Sep 26</span></div>',
          '</article>'
        ].join("\n");
      })()
    }
  ];

  function match(prompt) {
    var q = prompt.toLowerCase();
    var best = null, bestScore = 0;
    TEMPLATES.forEach(function (t) {
      var score = 0;
      t.keys.forEach(function (k) {
        if (q.indexOf(k) !== -1) score += k.length;
      });
      if (score > bestScore) {
        bestScore = score;
        best = t;
      }
    });
    return best;
  }

  function fallback(prompt) {
    return {
      id: "note",
      title: "Note",
      narration: "The desk demo has five scripted tools, and that request is not one of them. Here is the note back, with your words quoted as text.",
      html: [
        '<article class="pg-note">',
        '  <strong>Request received</strong>',
        '  <q>' + F.escapeHtml(prompt) + '</q>',
        '  <span>Try: managed plan · portal sign-in · ticket board · ticket chart · permit status</span>',
        '</article>'
      ].join("\n")
    };
  }

  /* ------------------------------------------------------------------ */
  /* DOM                                                                */
  /* ------------------------------------------------------------------ */

  var log, chips, form, input, send, preview, codeEl, meta, status, paneP, paneC, tabP, tabC;
  var run = null;

  function el(html) {
    var t = document.createElement("template");
    t.innerHTML = html.trim();
    return t.content.firstChild;
  }

  function addMessage(kind, bodyHtml) {
    var node = el(
      '<div class="msg msg--' + kind + '">' +
        '<span class="msg__avatar" aria-hidden="true">' + (kind === "ai" ? "CC" : "You") + "</span>" +
        '<div class="msg__body">' + bodyHtml + "</div>" +
      "</div>"
    );
    log.appendChild(node);
    log.scrollTop = log.scrollHeight;
    return node.querySelector(".msg__body");
  }

  function setStatus(text, cls) {
    status.textContent = text;
    status.className = "tag" + (cls ? " " + cls : "");
  }

  function setStage(tab) {
    var isPreview = tab === "preview";
    tabP.setAttribute("aria-selected", isPreview ? "true" : "false");
    tabC.setAttribute("aria-selected", isPreview ? "false" : "true");
    paneP.hidden = !isPreview;
    paneC.hidden = isPreview;
  }

  function setBusy(busy) {
    send.disabled = busy;
    input.disabled = busy;
    chips.querySelectorAll(".chip").forEach(function (c) { c.disabled = busy; });
  }

  function mount(html) {
    preview.innerHTML = '<div class="pg-mount">' + html + "</div>";
  }

  function kb(str) {
    return (new Blob([str]).size / 1024).toFixed(1) + " kB";
  }

  /* ------------------------------------------------------------------ */
  /* The build sequence                                                 */
  /* ------------------------------------------------------------------ */

  function build(prompt) {
    prompt = prompt.trim();
    if (!prompt) return;
    if (run) run.cancel();
    run = F.createRun();
    var mine = run;
    var template = match(prompt) || fallback(prompt);
    var t0 = performance.now();

    setBusy(true);
    addMessage("user", "<p>" + F.escapeHtml(prompt) + "</p>");
    var body = addMessage("ai", '<span class="thinking" aria-label="Thinking"><i></i><i></i><i></i></span>');
    setStatus("planning", "tag--violet");
    meta.textContent = "building " + template.title.toLowerCase() + "…";
    codeEl.innerHTML = "";

    var instant = F.reducedMotion();

    mine.wait(instant ? 0 : 900).then(function () {
      body.innerHTML = "<p></p>";
      var p = body.querySelector("p");
      setStatus("designing", "tag--violet");
      return F.stream(p, template.narration, {
        run: mine,
        speed: 11,
        render: function (partial) {
          p.textContent = partial;
          log.scrollTop = log.scrollHeight;
        }
      });
    }).then(function () {
      setStatus("writing markup", "tag--magenta");
      setStage("code");
      return F.stream(codeEl, template.html, {
        run: mine,
        speed: 5,
        render: function (partial) {
          codeEl.innerHTML = F.highlight(partial, "html") + '<span class="caret" aria-hidden="true"></span>';
          paneC.scrollTop = paneC.scrollHeight;
        }
      });
    }).then(function () {
      codeEl.innerHTML = F.highlight(template.html, "html");
      return mine.wait(instant ? 0 : 350);
    }).then(function () {
      mount(template.html);
      setStage("preview");
      setStatus("mounted", "tag--live");
      if (window.matchMedia("(max-width: 960px)").matches) {
        preview.closest(".stage").scrollIntoView({ behavior: instant ? "auto" : "smooth", block: "start" });
      }
      var secs = ((performance.now() - t0) / 1000).toFixed(1);
      meta.textContent = template.title + " · " + kb(template.html);
      var note = document.createElement("p");
      note.className = "msg__status";
      note.innerHTML = "Mounted <code>" + template.id + "</code> · " + kb(template.html) + " · " + secs + " s · interactive";
      body.appendChild(note);
      log.scrollTop = log.scrollHeight;
      setBusy(false);
      input.focus({ preventScroll: true });
    }).catch(function () {
      /* cancelled by a newer prompt */
    });
  }

  /* ------------------------------------------------------------------ */
  /* Component interactivity (event delegation on the preview)          */
  /* ------------------------------------------------------------------ */

  function initInteractions() {
    preview.addEventListener("click", function (e) {
      var period = e.target.closest("[data-period]");
      if (period) {
        var card = period.closest(".pg-pricing");
        card.querySelectorAll("[data-period]").forEach(function (b) {
          b.setAttribute("aria-pressed", b === period ? "true" : "false");
        });
        var yearly = period.getAttribute("data-period") === "yearly";
        card.querySelector("[data-price]").textContent = yearly ? "2040" : "2400";
        card.querySelector("[data-save]").textContent = yearly ? "Billed €24,480 a year · you save 15%" : "";
        return;
      }
      var cta = e.target.closest(".pg-pricing__cta");
      if (cta) {
        cta.textContent = "Request noted ✓";
        cta.disabled = true;
      }
    });

    preview.addEventListener("input", function (e) {
      var field = e.target.closest(".pg-field");
      if (!field) return;
      if (field.getAttribute("data-field") === "password") {
        var v = e.target.value;
        var level = 0;
        if (v.length >= 8) level++;
        if (/[A-Z]/.test(v) && /[a-z]/.test(v)) level++;
        if (/\d/.test(v)) level++;
        if (/[^A-Za-z0-9]/.test(v)) level++;
        var meter = field.parentElement.querySelector(".pg-strength");
        if (meter) meter.setAttribute("data-level", String(v.length ? Math.max(1, level) : 0));
      }
      if (field.classList.contains("is-invalid")) validateField(field);
    });

    preview.addEventListener("submit", function (e) {
      var f = e.target.closest("[data-pg-form]");
      if (!f) return;
      e.preventDefault();
      var ok = true;
      f.querySelectorAll(".pg-field").forEach(function (field) {
        if (!validateField(field)) ok = false;
      });
      if (!ok) {
        var first = f.querySelector(".pg-field.is-invalid input");
        if (first) first.focus();
        return;
      }
      var btn = f.querySelector('button[type="submit"]');
      var done = document.createElement("div");
      done.className = "pg-success";
      done.setAttribute("role", "status");
      done.textContent = "Sign-in link noted on this page. Nothing was sent.";
      btn.replaceWith(done);
    });

    function validateField(field) {
      var input = field.querySelector("input");
      var msg = field.querySelector("small");
      var v = input.value.trim();
      var error = "";
      if (field.getAttribute("data-field") === "email") {
        if (!v) error = "Email is required.";
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v)) error = "That doesn't look like a valid email.";
      } else {
        if (!v) error = "Password is required.";
        else if (v.length < 8) error = "Use at least 8 characters.";
      }
      field.classList.toggle("is-invalid", !!error);
      msg.textContent = error;
      return !error;
    }

    /* Kanban drag and drop */
    var dragging = null;

    preview.addEventListener("dragstart", function (e) {
      var task = e.target.closest(".pg-task");
      if (!task) return;
      dragging = task;
      task.classList.add("is-dragging");
      e.dataTransfer.effectAllowed = "move";
      e.dataTransfer.setData("text/plain", task.id);
    });

    preview.addEventListener("dragend", function () {
      if (dragging) dragging.classList.remove("is-dragging");
      dragging = null;
      preview.querySelectorAll(".pg-col.is-over").forEach(function (c) { c.classList.remove("is-over"); });
    });

    preview.addEventListener("dragover", function (e) {
      var col = e.target.closest(".pg-col");
      if (!col || !dragging) return;
      e.preventDefault();
      e.dataTransfer.dropEffect = "move";
      preview.querySelectorAll(".pg-col.is-over").forEach(function (c) { if (c !== col) c.classList.remove("is-over"); });
      col.classList.add("is-over");
    });

    preview.addEventListener("dragleave", function (e) {
      var col = e.target.closest(".pg-col");
      if (col && !col.contains(e.relatedTarget)) col.classList.remove("is-over");
    });

    preview.addEventListener("drop", function (e) {
      var col = e.target.closest(".pg-col");
      if (!col || !dragging) return;
      e.preventDefault();
      var after = e.target.closest(".pg-task");
      if (after && after !== dragging && after.parentElement === col) {
        col.insertBefore(dragging, after);
      } else {
        col.appendChild(dragging);
      }
      col.classList.remove("is-over");
      preview.querySelectorAll(".pg-col").forEach(function (c) {
        c.querySelector(".pg-col__count").textContent = c.querySelectorAll(".pg-task").length;
      });
    });
  }

  /* ------------------------------------------------------------------ */

  document.addEventListener("DOMContentLoaded", function () {
    log = document.getElementById("chat-log");
    chips = document.getElementById("chips");
    form = document.getElementById("chat-form");
    input = document.getElementById("chat-input");
    send = document.getElementById("chat-send");
    preview = document.getElementById("pg-preview");
    codeEl = document.getElementById("pg-code");
    meta = document.getElementById("stage-meta");
    status = document.getElementById("stage-status");
    paneP = document.getElementById("pane-preview");
    paneC = document.getElementById("pane-code");
    tabP = document.getElementById("tab-preview");
    tabC = document.getElementById("tab-code");
    if (!log || !preview) return;

    chips.addEventListener("click", function (e) {
      var chip = e.target.closest("[data-prompt]");
      if (chip && !chip.disabled) build(chip.getAttribute("data-prompt"));
    });

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var v = input.value;
      input.value = "";
      build(v);
    });

    document.querySelectorAll("[data-stage-tab]").forEach(function (b) {
      b.addEventListener("click", function () { setStage(b.getAttribute("data-stage-tab")); });
    });

    initInteractions();

    TEMPLATES.forEach(function (t) {
      F.actions["pg-" + t.id] = {
        label: "Open desk tool: " + t.title,
        hint: "playground",
        run: function () {
          document.getElementById("playground").scrollIntoView({ behavior: "smooth" });
          var chip = chips.querySelector('[data-prompt*="' + t.keys[0] + '" i]');
          build(chip ? chip.getAttribute("data-prompt") : t.title);
        }
      };
    });
  });
})();
