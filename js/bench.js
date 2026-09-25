/**
 * bench.js — Capability comparison chart
 * ---------------------------------------------------------------------------
 * Renders grouped horizontal bars from a small dataset, animates them in on
 * scroll, and offers a real <table> view of the same numbers. All values are
 * illustrative demo data (see the note under the chart).
 */

(function () {
  "use strict";

  var F = window.Fable;
  if (!F) return;

  var SERIES = [
    { name: "Fable 5", color: "var(--violet)" },
    { name: "Fable 4", color: "var(--cyan)" },
    { name: "Prior generation", color: "var(--text-3)" }
  ];

  var ROWS = [
    { label: "Graduate-level reasoning", sub: "multi-step science & math", values: [91, 78, 64] },
    { label: "Repository-scale coding", sub: "resolve real issues end to end", values: [87, 69, 52] },
    { label: "Multimodal understanding", sub: "charts, diagrams, photos", values: [84, 71, 58] },
    { label: "Agentic tool use", sub: "long-horizon, multi-tool tasks", values: [89, 66, 41] },
    { label: "1M-token recall", sub: "needle retrieval at full context", values: [96, 80, 49] }
  ];

  document.addEventListener("DOMContentLoaded", function () {
    var legend = document.getElementById("bench-legend");
    var rows = document.getElementById("bench-rows");
    var toggle = document.getElementById("bench-toggle");
    var table = document.getElementById("bench-table");
    var thead = document.getElementById("bench-table-head");
    var tbody = document.getElementById("bench-table-body");
    if (!rows) return;

    legend.innerHTML = SERIES.map(function (s) {
      return '<span><i style="--c:' + s.color + '"></i>' + F.escapeHtml(s.name) + "</span>";
    }).join("");

    rows.innerHTML = ROWS.map(function (r, ri) {
      var bars = r.values.map(function (v, si) {
        return '<div class="bar" role="img" aria-label="' + F.escapeHtml(SERIES[si].name) + ": " + v + '">' +
          '<div class="bar__fill" style="--v:' + v + ";--c:" + SERIES[si].color + ";--i:" + (ri * 3 + si) + '"></div>' +
          '<span class="bar__val">' + v + "</span></div>";
      }).join("");
      return '<div class="bench-row"><div class="bench-row__label">' + F.escapeHtml(r.label) +
        "<small>" + F.escapeHtml(r.sub) + '</small></div><div class="bars">' + bars + "</div></div>";
    }).join("");

    thead.innerHTML = "<th scope=\"col\">Task family</th>" + SERIES.map(function (s) {
      return '<th scope="col">' + F.escapeHtml(s.name) + "</th>";
    }).join("");
    tbody.innerHTML = ROWS.map(function (r) {
      return '<tr><th scope="row">' + F.escapeHtml(r.label) + "</th>" + r.values.map(function (v) {
        return "<td>" + v + "</td>";
      }).join("") + "</tr>";
    }).join("");

    var barGroups = rows.querySelectorAll(".bars");
    F.onVisible(rows, function () {
      barGroups.forEach(function (g) { g.classList.add("is-in"); });
    }, 0.3);

    toggle.addEventListener("click", function () {
      var showTable = table.hidden;
      table.hidden = !showTable;
      rows.hidden = showTable;
      toggle.setAttribute("aria-pressed", showTable ? "true" : "false");
      toggle.textContent = showTable ? "Show as chart" : "Show as table";
      if (!showTable) barGroups.forEach(function (g) { g.classList.add("is-in"); });
    });

    F.actions.bench = { label: "Toggle benchmark table view", hint: "benchmarks", run: function () {
      document.getElementById("benchmarks").scrollIntoView({ behavior: "smooth" });
      toggle.click();
    } };
  });
})();
