// Leonida Trophy Ledger — offline tracker. Loads only app/data/trophies.json.
// Progress lives in localStorage under one key; export/import move that same JSON.
(function () {
  "use strict";

  var STORAGE_KEY = "leonida-trophy-ledger-v1";
  var DATA_URL = "data/trophies.json";

  var trophies = [];
  var earned = {};
  var hideSpoilers = false;
  var currentDetail = null;

  var listEl = document.getElementById("trophyList");
  var missableEl = document.getElementById("missableList");
  var searchEl = document.getElementById("search");
  var kindEl = document.getElementById("kindFilter");
  var gradeEl = document.getElementById("gradeFilter");
  var statusEl = document.getElementById("statusFilter");
  var spoilerEl = document.getElementById("spoilerToggle");
  var emptyEl = document.getElementById("emptyState");
  var saveNoteEl = document.getElementById("saveNote");
  var detailEl = document.getElementById("detail");

  function loadProgress() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      var parsed = JSON.parse(raw);
      if (parsed && typeof parsed === "object") earned = parsed;
    } catch (err) {
      earned = {};
    }
  }

  function saveProgress(note) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(earned));
      if (note) showNote(note);
    } catch (err) {
      showNote("Could not save progress in this browser.");
    }
  }

  function showNote(text) {
    saveNoteEl.textContent = text;
    window.clearTimeout(showNote._t);
    showNote._t = window.setTimeout(function () { saveNoteEl.textContent = ""; }, 4000);
  }

  function isEarned(t) { return !!earned[t.id]; }

  function spoilerHidden(t) {
    return hideSpoilers && t.kind === "story" && !isEarned(t);
  }

  function displayName(t) {
    return spoilerHidden(t) ? "Hidden story trophy" : t.name;
  }

  function displayDesc(t) {
    return spoilerHidden(t) ? "Hidden until earned — turn off the spoiler setting to reveal it." : t.description;
  }

  function gradeLabel(t) {
    return t.grade.charAt(0).toUpperCase() + t.grade.slice(1);
  }

  function kindLabel(t) {
    return t.kind.charAt(0).toUpperCase() + t.kind.slice(1);
  }

  function makeTag(text, cls) {
    var s = document.createElement("span");
    s.className = "tag" + (cls ? " " + cls : "");
    s.textContent = text;
    return s;
  }

  function renderTrophy(t, intoList) {
    var li = document.createElement("li");
    li.className = "trophy" + (isEarned(t) ? " earned" : "");
    li.dataset.id = String(t.id);

    var check = document.createElement("input");
    check.type = "checkbox";
    check.className = "trophy-check";
    check.checked = isEarned(t);
    check.setAttribute("aria-label", "Mark " + displayName(t) + " as earned");
    check.addEventListener("change", function () {
      earned[t.id] = check.checked;
      if (!check.checked) delete earned[t.id];
      saveProgress("Progress saved.");
      renderAll();
      if (currentDetail === t.id) openDetail(t.id);
    });
    li.appendChild(check);

    var body = document.createElement("div");

    var h = document.createElement("p");
    h.className = "trophy-name";
    var btn = document.createElement("button");
    btn.type = "button";
    btn.textContent = displayName(t);
    btn.addEventListener("click", function () { openDetail(t.id); });
    h.appendChild(btn);
    body.appendChild(h);

    var desc = document.createElement("p");
    desc.className = "trophy-desc";
    desc.textContent = displayDesc(t);
    body.appendChild(desc);

    var tags = document.createElement("div");
    tags.className = "trophy-tags";
    tags.appendChild(makeTag(gradeLabel(t), "grade-" + t.grade));
    tags.appendChild(makeTag(kindLabel(t)));
    if (t.missable) tags.appendChild(makeTag("Missable", "missable"));
    if (t.hidden) tags.appendChild(makeTag("Hidden", "hidden-flag"));
    body.appendChild(tags);

    li.appendChild(body);
    intoList.appendChild(li);
    return li;
  }

  function matchesFilters(t) {
    var q = searchEl.value.trim().toLowerCase();
    if (q) {
      var hay = (t.name + " " + t.description + " " + t.guide).toLowerCase();
      if (hay.indexOf(q) === -1) return false;
    }
    if (kindEl.value === "missable") {
      if (!t.missable) return false;
    } else if (kindEl.value !== "all" && t.kind !== kindEl.value) {
      return false;
    }
    if (gradeEl.value !== "all" && t.grade !== gradeEl.value) return false;
    if (statusEl.value === "earned" && !isEarned(t)) return false;
    if (statusEl.value === "unearned" && isEarned(t)) return false;
    return true;
  }

  function renderList() {
    listEl.innerHTML = "";
    var shown = 0;
    trophies.forEach(function (t) {
      if (!matchesFilters(t)) return;
      renderTrophy(t, listEl);
      shown += 1;
    });
    emptyEl.hidden = shown !== 0;
  }

  function renderMissable() {
    missableEl.innerHTML = "";
    trophies.filter(function (t) { return t.missable; }).forEach(function (t) {
      renderTrophy(t, missableEl);
    });
  }

  function renderProgress() {
    var total = trophies.length;
    var count = trophies.filter(isEarned).length;
    var pct = total ? Math.round((count / total) * 100) : 0;
    document.getElementById("progressText").textContent = count + " / " + total + " earned";
    document.getElementById("progressPct").textContent = pct + "%";
    document.getElementById("progressFill").style.width = pct + "%";
    document.getElementById("progressBar").setAttribute("aria-valuenow", String(count));
    var byGrade = {};
    trophies.forEach(function (t) {
      byGrade[t.grade] = byGrade[t.grade] || { got: 0, all: 0 };
      byGrade[t.grade].all += 1;
      if (isEarned(t)) byGrade[t.grade].got += 1;
    });
    var order = ["platinum", "gold", "silver", "bronze"];
    document.getElementById("gradeCounts").textContent = order.map(function (g) {
      return gradeLabel({ grade: g }) + " " + (byGrade[g] ? byGrade[g].got : 0) + "/" + (byGrade[g] ? byGrade[g].all : 0);
    }).join(" · ");
  }

  function renderAll() {
    renderList();
    renderMissable();
    renderProgress();
  }

  function openDetail(id) {
    var t = null;
    trophies.forEach(function (x) { if (x.id === id) t = x; });
    if (!t) return;
    currentDetail = id;
    document.getElementById("detailGrade").textContent = gradeLabel(t) + " · " + kindLabel(t) + (t.missable ? " · Missable" : "") + (t.hidden ? " · Hidden" : "");
    document.getElementById("detailName").textContent = displayName(t);
    document.getElementById("detailDesc").textContent = displayDesc(t);
    document.getElementById("detailGuide").textContent = t.guide;
    document.getElementById("detailSource").textContent = t.source || "Official trophy description.";
    document.getElementById("detailMeta").textContent = "Trophy " + t.id + " of " + trophies.length + " · " + t.grade + " · kind: " + t.kind + " · missable: " + (t.missable ? "yes" : "no");
    var box = document.getElementById("detailEarned");
    box.checked = isEarned(t);
    box.onchange = function () {
      earned[t.id] = box.checked;
      if (!box.checked) delete earned[t.id];
      saveProgress("Progress saved.");
      renderAll();
    };
    detailEl.hidden = false;
    detailEl.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }

  function switchView(name) {
    document.querySelectorAll(".view-btn").forEach(function (b) {
      b.classList.toggle("active", b.dataset.view === name);
    });
    document.getElementById("view-checklist").hidden = name !== "checklist";
    document.getElementById("view-roadmap").hidden = name !== "roadmap";
    document.getElementById("view-missable").hidden = name !== "missable";
  }

  function exportProgress() {
    var payload = { app: "leonida-trophy-ledger", version: 1, earned: Object.keys(earned).map(Number).sort(function (a, b) { return a - b; }) };
    var blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    var url = URL.createObjectURL(blob);
    var a = document.createElement("a");
    a.href = url;
    a.download = "leonida-trophy-progress.json";
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
    showNote("Progress exported.");
  }

  function importProgress(file) {
    var reader = new FileReader();
    reader.onload = function () {
      try {
        var parsed = JSON.parse(String(reader.result));
        var ids = Array.isArray(parsed) ? parsed : parsed.earned;
        if (!Array.isArray(ids)) throw new Error("bad file");
        var next = {};
        ids.forEach(function (id) {
          var n = Number(id);
          if (trophies.some(function (t) { return t.id === n; })) next[n] = true;
        });
        earned = next;
        saveProgress("Progress imported.");
        renderAll();
      } catch (err) {
        showNote("That file could not be imported. Export a progress file first and import that one.");
      }
    };
    reader.readAsText(file);
  }

  document.querySelectorAll(".view-btn").forEach(function (b) {
    b.addEventListener("click", function () { switchView(b.dataset.view); });
  });
  [searchEl, kindEl, gradeEl, statusEl].forEach(function (el) {
    el.addEventListener("input", renderList);
    el.addEventListener("change", renderList);
  });
  spoilerEl.addEventListener("change", function () {
    hideSpoilers = spoilerEl.checked;
    renderAll();
  });
  document.getElementById("detailClose").addEventListener("click", function () {
    detailEl.hidden = true;
    currentDetail = null;
  });
  document.getElementById("exportBtn").addEventListener("click", exportProgress);
  document.getElementById("importBtn").addEventListener("click", function () {
    document.getElementById("importFile").click();
  });
  document.getElementById("importFile").addEventListener("change", function (ev) {
    if (ev.target.files && ev.target.files[0]) importProgress(ev.target.files[0]);
    ev.target.value = "";
  });
  document.getElementById("resetBtn").addEventListener("click", function () {
    if (window.confirm("Clear all earned trophies? This cannot be undone.")) {
      earned = {};
      saveProgress("Progress reset.");
      renderAll();
    }
  });

  loadProgress();
  fetch(DATA_URL)
    .then(function (r) {
      if (!r.ok) throw new Error("Could not load trophy data (" + r.status + ")");
      return r.json();
    })
    .then(function (data) {
      trophies = Array.isArray(data) ? data : data.trophies;
      trophies.sort(function (a, b) { return a.id - b.id; });
      renderAll();
    })
    .catch(function (err) {
      listEl.innerHTML = "";
      var li = document.createElement("li");
      li.className = "empty-state";
      li.textContent = "The trophy data could not be loaded: " + err.message;
      listEl.appendChild(li);
    });
})();
