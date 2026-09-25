/**
 * agent.js — Replayable end-to-end agent run
 * ---------------------------------------------------------------------------
 * Plays a scripted timeline against three panels: the step rail, a terminal
 * (tool calls + output) and a diff view that fills in as edits land. The
 * scenario is an accessibility ticket on the case-study repo's forms.js.
 * Supports pause/resume, restart, 1×/2× speed, and reduced motion (instant).
 */

(function () {
  "use strict";

  var F = window.Fable;
  if (!F) return;

  /* Timeline: [delayMs, action, payload] ------------------------------- */
  var T = [
    [0, "status", "Reading ticket #41…"],
    [0, "line", "cmd", 'fable run "Contact form errors are invisible to screen readers (#41)"'],
    [500, "line", "dim", "session 9f3c · repo cyprus-communications · branch main"],
    [600, "step", "plan"],
    [200, "line", "head", "Planning"],
    [500, "line", "out", "The ticket says the inline errors render visually but VoiceOver never announces them."],
    [700, "line", "out", "1. Find where errors are rendered on submit"],
    [400, "line", "out", "2. Mark the input invalid and make the message a live region"],
    [400, "line", "out", "3. Add a regression test, run it, ship"],
    [900, "step", "explore"],
    [200, "line", "head", "Exploring"],
    [300, "line", "cmd", "rg -n \"is-invalid|field-error\" js contact"],
    [250, "tools", 1],
    [700, "line", "out", "js/forms.js:25:    form.querySelectorAll(\".form-field.is-invalid\")…"],
    [120, "line", "out", "js/forms.js:31:    field.classList.add(\"is-invalid\");"],
    [120, "line", "out", "js/forms.js:32:    var error = field.querySelector(\".field-error\");"],
    [120, "line", "out", "contact/index.html:74:  <span class=\"field-error\">Enter a valid email address.</span>"],
    [800, "line", "cmd", "sed -n 24,35p js/forms.js"],
    [250, "tools", 2],
    [700, "line", "dim", "function markInvalid(field, message) {\n  field.classList.add(\"is-invalid\");\n  var error = field.querySelector(\".field-error\");\n  if (error && message) error.textContent = message;\n}"],
    [900, "line", "out", "Found it: the error text is set, but nothing tells assistive tech the input is invalid, and the span isn't a live region. Two small changes in one file."],
    [900, "step", "edit"],
    [200, "line", "head", "Editing js/forms.js"],
    [300, "file", "js/forms.js"],
    [300, "diff", "hunk", "@@ -24,6 +24,8 @@ function clearFieldErrors(form)"],
    [140, "diff", "ctx", "25", "  form.querySelectorAll(\".form-field.is-invalid\").forEach(function (field) {"],
    [140, "diff", "ctx", "26", "    field.classList.remove(\"is-invalid\");"],
    [220, "diff", "add", "27", "    var input = field.querySelector(\"[aria-invalid]\");"],
    [220, "diff", "add", "28", "    if (input) input.removeAttribute(\"aria-invalid\");"],
    [140, "diff", "ctx", "29", "  });"],
    [400, "diff", "hunk", "@@ -30,6 +32,11 @@ function markInvalid(field, message)"],
    [140, "diff", "ctx", "33", "  field.classList.add(\"is-invalid\");"],
    [220, "diff", "add", "34", "  var input = field.querySelector(\"input, select, textarea\");"],
    [220, "diff", "add", "35", "  if (input) input.setAttribute(\"aria-invalid\", \"true\");"],
    [140, "diff", "ctx", "36", "  var error = field.querySelector(\".field-error\");"],
    [220, "diff", "del", "34", "  if (error && message) error.textContent = message;"],
    [220, "diff", "add", "37", "  if (error && message) {"],
    [220, "diff", "add", "38", "    error.setAttribute(\"role\", \"alert\");"],
    [220, "diff", "add", "39", "    error.textContent = message;"],
    [220, "diff", "add", "40", "  }"],
    [140, "diff", "ctx", "41", "}"],
    [300, "stats", 8, 1],
    [250, "tools", 3],
    [500, "line", "ok", "applied 2 hunks to js/forms.js (+8 −1)"],
    [900, "step", "test"],
    [200, "line", "head", "Testing"],
    [300, "line", "cmd", "cat > tests/forms.a11y.test.js  # 3 cases: sets aria-invalid, role=alert, clears on input"],
    [250, "tools", 4],
    [600, "line", "cmd", "npx vitest run tests/forms.a11y.test.js"],
    [250, "tools", 5],
    [1400, "line", "out", " ✓ marks the input aria-invalid on submit"],
    [200, "line", "out", " ✓ exposes the message as role=alert"],
    [300, "line", "warn", " ✗ clears aria-invalid while the user edits"],
    [400, "line", "dim", "   expected input.getAttribute(\"aria-invalid\") to be null, got \"true\""],
    [1000, "line", "out", "The input listener only removes the class. I'll clear the attribute there too."],
    [700, "diff", "hunk", "@@ -96,7 +103,9 @@ form.addEventListener(\"input\", …)"],
    [140, "diff", "ctx", "104", "    var field = event.target.closest(\".form-field\");"],
    [220, "diff", "del", "98", "    if (field) field.classList.remove(\"is-invalid\");"],
    [220, "diff", "add", "105", "    if (!field) return;"],
    [220, "diff", "add", "106", "    field.classList.remove(\"is-invalid\");"],
    [220, "diff", "add", "107", "    event.target.removeAttribute(\"aria-invalid\");"],
    [300, "stats", 11, 2],
    [250, "tools", 6],
    [500, "line", "cmd", "npx vitest run tests/forms.a11y.test.js"],
    [250, "tools", 7],
    [1200, "line", "ok", " ✓ tests/forms.a11y.test.js  (3 tests)  38ms"],
    [500, "line", "cmd", "npx vitest run  # full suite"],
    [250, "tools", 8],
    [1100, "line", "ok", " ✓ 4 files · 17 tests passed  412ms"],
    [900, "step", "ship"],
    [200, "line", "head", "Shipping"],
    [300, "line", "cmd", "git checkout -b fix/announce-form-errors && git add -A"],
    [250, "tools", 9],
    [500, "line", "cmd", 'git commit -m "Announce contact form errors to assistive tech"'],
    [250, "tools", 10],
    [600, "line", "dim", "[fix/announce-form-errors 4b1e2c7] 2 files changed, 47 insertions(+), 2 deletions(-)"],
    [400, "line", "cmd", "gh pr create --fill --base main"],
    [250, "tools", 11],
    [900, "line", "link", "https://github.com/cj/cyprus-communications/pull/42"],
    [600, "line", "done", "Done in 1m 12s · 11 tool calls · 2 files changed · closes #41"],
    [0, "status", "Run complete."],
    [0, "finish"]
  ];

  /* ------------------------------------------------------------------ */

  var steps, terminal, diff, diffFile, diffStats, toolsTag, statusEl, toggleBtn, restartBtn, speedBtn;
  var state = { run: null, paused: false, speed: 1, finished: false, started: false };
  var stepOrder = ["plan", "explore", "edit", "test", "ship"];

  function line(kind, text) {
    var node = document.createElement("div");
    node.className = "tl tl--" + kind;
    node.textContent = text;
    terminal.appendChild(node);
    terminal.scrollTop = terminal.scrollHeight;
  }

  function diffLine(kind, n, text) {
    var empty = diff.querySelector(".diff__empty");
    if (empty) empty.remove();
    var row = document.createElement("div");
    row.className = "dl dl--" + kind;
    if (kind === "hunk") {
      row.innerHTML = '<span class="dl__n"></span><span></span>';
      row.lastChild.textContent = n;
    } else {
      row.innerHTML = '<span class="dl__n"></span><span></span>';
      row.firstChild.textContent = n;
      row.lastChild.textContent = (kind === "add" ? "+" : kind === "del" ? "-" : " ") + text;
    }
    diff.appendChild(row);
    diff.scrollTop = diff.scrollHeight;
  }

  function setStep(id) {
    var reached = stepOrder.indexOf(id);
    steps.forEach(function (s) {
      var idx = stepOrder.indexOf(s.getAttribute("data-step"));
      s.classList.toggle("is-done", idx < reached);
      s.classList.toggle("is-active", idx === reached);
    });
  }

  function reset() {
    if (state.run) state.run.cancel();
    terminal.innerHTML = "";
    diff.innerHTML = '<p class="diff__empty">No changes yet. The diff fills in as the agent edits.</p>';
    diffFile.textContent = "working tree";
    diffStats.innerHTML = "";
    toolsTag.textContent = "0 tool calls";
    statusEl.textContent = "Waiting to start…";
    steps.forEach(function (s) { s.classList.remove("is-done", "is-active"); });
    state.finished = false;
    state.paused = false;
    toggleBtn.textContent = "Pause";
    toggleBtn.disabled = false;
  }

  function apply(ev) {
    var a = ev[1];
    if (a === "line") line(ev[2], ev[3]);
    else if (a === "step") setStep(ev[2]);
    else if (a === "diff") ev[2] === "hunk" ? diffLine("hunk", ev[3]) : diffLine(ev[2], ev[3], ev[4]);
    else if (a === "file") diffFile.textContent = ev[2];
    else if (a === "stats") diffStats.innerHTML = '<span class="add">+' + ev[2] + '</span> <span class="del">−' + ev[3] + "</span>";
    else if (a === "tools") toolsTag.textContent = ev[2] + " tool call" + (ev[2] === 1 ? "" : "s");
    else if (a === "status") statusEl.textContent = ev[2];
    else if (a === "finish") finish();
  }

  function finish() {
    steps.forEach(function (s) { s.classList.remove("is-active"); s.classList.add("is-done"); });
    state.finished = true;
    toggleBtn.textContent = "Pause";
    toggleBtn.disabled = true;
  }

  function wait(ms, run) {
    // `remaining` is measured in script-time ms; real elapsed time is scaled
    // by the current speed so toggling 1×/2× mid-wait takes effect at once.
    return new Promise(function (resolve, reject) {
      var remaining = ms;
      var last = performance.now();
      (function tick(now) {
        if (run.cancelled) return reject(new Error("cancelled"));
        if (!state.paused) remaining -= (now - last) * state.speed;
        last = now;
        if (remaining <= 0) return resolve();
        requestAnimationFrame(tick);
      })(last);
    });
  }

  function play() {
    reset();
    state.started = true;
    var run = F.createRun();
    state.run = run;

    if (F.reducedMotion()) {
      T.forEach(apply);
      return;
    }

    var i = 0;
    (function next() {
      if (i >= T.length) return;
      var ev = T[i++];
      wait(ev[0], run).then(function () {
        if (run.cancelled) return;
        apply(ev);
        next();
      }).catch(function () { /* cancelled */ });
    })();
  }

  document.addEventListener("DOMContentLoaded", function () {
    var root = document.getElementById("agent-steps");
    terminal = document.getElementById("terminal");
    diff = document.getElementById("diff");
    if (!root || !terminal || !diff) return;
    steps = Array.prototype.slice.call(root.querySelectorAll(".step"));
    diffFile = document.getElementById("diff-file");
    diffStats = document.getElementById("diff-stats");
    toolsTag = document.getElementById("agent-tools");
    statusEl = document.getElementById("agent-status");
    toggleBtn = document.getElementById("agent-toggle");
    restartBtn = document.getElementById("agent-restart");
    speedBtn = document.getElementById("agent-speed");

    toggleBtn.addEventListener("click", function () {
      if (!state.started) return play();
      state.paused = !state.paused;
      toggleBtn.textContent = state.paused ? "Resume" : "Pause";
      statusEl.textContent = state.paused ? "Paused." : "Running…";
    });

    restartBtn.addEventListener("click", play);

    speedBtn.addEventListener("click", function () {
      state.speed = state.speed === 1 ? 2 : 1;
      speedBtn.textContent = state.speed + "×";
      speedBtn.setAttribute("aria-pressed", state.speed === 2 ? "true" : "false");
    });

    F.onVisible(terminal, function () {
      if (!state.started) play();
    }, 0.3);

    F.actions.agent = { label: "Replay agent run", hint: "agent", run: function () {
      document.getElementById("agent").scrollIntoView({ behavior: "smooth" });
      play();
    } };
  });
})();
