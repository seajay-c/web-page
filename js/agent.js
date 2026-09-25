/**
 * agent.js — Replayable end-to-end agent run
 * ---------------------------------------------------------------------------
 * Plays a scripted timeline against three panels: the step rail, a terminal
 * (tool calls + output) and a diff view that fills in as edits land. The
 * scenario is ticket 1842: a finance share lost after a firewall change.
 * Supports pause/resume, restart, 1×/2× speed, and reduced motion (instant).
 */

(function () {
  "use strict";

  var F = window.Desk;
  if (!F) return;

  /* Timeline: [delayMs, action, payload] ------------------------------- */
  var T = [
    [0, "status", "Reading ticket 1842…"],
    [0, "line", "cmd", "desk open 1842 --site Strovolos"],
    [500, "line", "dim", "on-call · Eleni Christou · Troodos Bakery · P1"],
    [600, "step", "plan"],
    [200, "line", "head", "Alert"],
    [500, "line", "out", "Finance share unreachable since 08:10. Mail still works."],
    [400, "line", "out", "1. Confirm it is one site, not the whole retainer"],
    [400, "line", "out", "2. Check the 08:00 firewall change"],
    [400, "line", "out", "3. Restore the route, prove the share, tell the client"],
    [900, "step", "explore"],
    [200, "line", "head", "Diagnose"],
    [300, "line", "cmd", "show vpn route Strovolos 10.4.0.0/16"],
    [250, "tools", 1],
    [700, "line", "warn", "no route · split tunnel missing after 08:00 change"],
    [400, "line", "cmd", "ping 10.4.12.20 from site-lan"],
    [250, "tools", 2],
    [600, "line", "ok", "file server answers on the LAN"],
    [400, "line", "cmd", "ping 10.4.12.20 from vpn"],
    [250, "tools", 3],
    [600, "line", "warn", "no reply through the tunnel"],
    [500, "line", "out", "The share is up. The tunnel forgot the route."],
    [900, "step", "edit"],
    [200, "line", "head", "Change"],
    [300, "file", "fw/strovolos-vpn.conf"],
    [300, "diff", "hunk", "@@ tunnel split-routes @@"],
    [160, "diff", "ctx", "12", "  site Strovolos"],
    [200, "diff", "del", "13", "  # 10.4.0.0/16 removed in 08:00 window"],
    [220, "diff", "add", "13", "  route 10.4.0.0/16 via 10.4.0.1"],
    [200, "diff", "add", "14", "  comment ticket-1842 finance share"],
    [300, "stats", 2, 1],
    [250, "tools", 4],
    [500, "line", "ok", "route restored on Strovolos VPN (+2 −1)"],
    [900, "step", "test"],
    [200, "line", "head", "Verify"],
    [300, "line", "cmd", "check share \\\\10.4.12.20\\finance as eleni"],
    [250, "tools", 5],
    [900, "line", "warn", " ✗ first check failed · session still on the old route"],
    [400, "line", "dim", "   reconnect the laptop, then retry once"],
    [700, "line", "cmd", "check share \\\\10.4.12.20\\finance as eleni --reconnect"],
    [250, "tools", 6],
    [1000, "line", "ok", " ✓ share opens · payroll folder listed"],
    [900, "step", "ship"],
    [200, "line", "head", "Update"],
    [300, "line", "cmd", "note 1842 --to eleni@troodosbakery.demo"],
    [250, "tools", 7],
    [700, "line", "out", "Access is restored. Your team can sign in again."],
    [400, "line", "out", "Cause: the 08:00 change dropped the finance route. It is back."],
    [500, "line", "done", "Closed in 18 min · 7 checks · client updated · ticket 1842"],
    [0, "status", "Incident closed."],
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
    toolsTag.textContent = "0 checks";
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
    else if (a === "tools") toolsTag.textContent = ev[2] + " check" + (ev[2] === 1 ? "" : "s");
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

    F.onVisible(document.getElementById("agent") || terminal, function () {
      if (!state.started) play();
    }, 0.15);

    F.actions.agent = { label: "Replay incident 1842", hint: "incident", run: function () {
      document.getElementById("agent").scrollIntoView({ behavior: "smooth" });
      play();
    } };
  });
})();
