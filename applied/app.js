const STORAGE_KEY = "applied-data-v1";

const STATUS_LABELS = {
  wishlist: "Wishlist",
  preparing: "Preparing",
  applied: "Applied",
  interview: "Interview",
  offer: "Offer",
  rejected: "Rejected",
  withdrawn: "Withdrawn"
};
const CLOSED_STATUSES = ["rejected", "withdrawn"];
const NOT_SENT_STATUSES = ["wishlist", "preparing"];
document.addEventListener("DOMContentLoaded", function () {
  
  const form = document.getElementById("app-form");
  const statusEl = document.getElementById("form-status");
  const rowsEl = document.getElementById("app-rows");
  const emptyEl = document.getElementById("empty");
  const tableWrap = document.querySelector(".table-wrap");
  const totalDocs = form.querySelectorAll('input[name="docs"]').length;

function isValidApp(app) {
  return (
    typeof app === "object" &&
    app !== null &&
    typeof app.id === "string" &&
    typeof app.role === "string" &&
    typeof app.employer === "string" &&
    Object.keys(STATUS_LABELS).includes(app.status) &&
    Array.isArray(app.docs)
  );
}

function load() {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY));
    return Array.isArray(parsed) ? parsed.filter(isValidApp) : [];
  } catch (error) {
    return [];
  }
}

function save() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(apps));
  } catch (error) {
    console.error(error);
    say("Could not save. Your browser may be blocking storage.", true);
  }
}

let apps = load();
function say(text, isError) {
  statusEl.textContent = text;
  statusEl.className = isError ? "error" : "";
}

function makeId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function parseDate(value) {
  const parts = value.split("-").map(Number);
  return new Date(parts[0], parts[1] - 1, parts[2]);
}

function formatDate(value) {
  return parseDate(value).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric"
  });
}

function daysUntil(value) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.round((parseDate(value) - today) / 86400000);
}

function safeLink(text) {
  if (!text) {
    return "";
  }
  try {
    const url = new URL(text);
    return url.protocol === "http:" || url.protocol === "https:" ? url.href : "";
  } catch (error) {
    return "";
  }
}

function isClosingSoon(app) {
  if (!app.deadline || !NOT_SENT_STATUSES.includes(app.status)) {
    return false;
  }
  const days = daysUntil(app.deadline);
  return days >= 0 && days <= 7;
}

function makeCell(text) {
  const td = document.createElement("td");
  td.textContent = text;
  return td;
}

function buildRow(app) {
  const tr = document.createElement("tr");

  if (deleteMode) {
    const checkTd = document.createElement("td");
    const cb = document.createElement("input");
    cb.type = "checkbox";
    cb.value = app.id;
    cb.setAttribute("aria-label", "Select " + app.role + " at " + app.employer);
    checkTd.append(cb);
    tr.append(checkTd);
  }

  const th = document.createElement("th");
  th.scope = "row";
  const href = safeLink(app.link);
  if (href) {
    const a = document.createElement("a");
    a.href = href;
    a.textContent = app.role;
    th.append(a);
  } else {
    th.textContent = app.role;
  }

  const deadlineCell = document.createElement("td");
  if (app.deadline) {
    const time = document.createElement("time");
    time.dateTime = app.deadline;
    time.textContent = formatDate(app.deadline);
    deadlineCell.append(time);
  } else {
    deadlineCell.textContent = "No deadline";
  }

  const actions = document.createElement("td");
  const del = document.createElement("button");
  del.type = "button";
  del.textContent = "Delete";
  del.dataset.id = app.id;
  del.setAttribute("aria-label", "Delete " + app.role + " at " + app.employer);
  actions.append(del);

  tr.append(
    th,
    makeCell(app.employer),
    deadlineCell,
    makeCell(STATUS_LABELS[app.status]),
    makeCell(app.docs.length + " of " + totalDocs),
    actions
  );
  return tr;
}

function updateStats() {
  const open = apps.filter(function (app) {
    return !CLOSED_STATUSES.includes(app.status);
  });
  document.getElementById("stat-total").textContent = apps.length;
  document.getElementById("stat-open").textContent = open.length;
  document.getElementById("stat-interview").textContent = apps.filter(function (app) {
    return app.status === "interview";
  }).length;
  document.getElementById("stat-soon").textContent = apps.filter(isClosingSoon).length;
}

function render() {
  const theadRow = document.querySelector("thead tr");
  theadRow.innerHTML = "";
  if (deleteMode) {
    theadRow.innerHTML += "<th scope='col'><span class='sr'>Select</span></th>";
  }
  theadRow.innerHTML += `
    <th scope="col">Job</th>
    <th scope="col">Employer</th>
    <th scope="col">Deadline</th>
    <th scope="col">Status</th>
    <th scope="col">Documents</th>
    <th scope="col">Actions</th>
  `;

  rowsEl.replaceChildren();
const filter = document.getElementById("filter").value;
const visible = filter === "all"
  ? apps
  : apps.filter(function (app) {
      return app.status === filter;
    });

visible.forEach(function (app) {
  rowsEl.append(buildRow(app));
});

  emptyEl.hidden = visible.length > 0;
tableWrap.hidden = visible.length === 0;
  updateStats();
}
document.getElementById("filter").addEventListener("change", function () {
  render();
});
let deleteMode = false;

function setDeleteMode(on) {
  deleteMode = on;
  document.getElementById("delete-mode-btn").hidden = on;
  document.getElementById("delete-controls").hidden = !on;
  render();
}

document.getElementById("delete-mode-btn").addEventListener("click", function () {
  setDeleteMode(true);
});

document.getElementById("cancel-delete").addEventListener("click", function () {
  setDeleteMode(false);
});

document.getElementById("delete-all").addEventListener("click", function () {
  if (apps.length === 0) {
    say("Nothing to delete.");
    return;
  }
  if (!confirm("Delete all " + apps.length + " applications?")) return;
  apps = [];
  save();
  setDeleteMode(false);
  say("All applications deleted.");
});

document.getElementById("delete-selected").addEventListener("click", function () {
  const boxes = document.querySelectorAll("#app-rows input[type=checkbox]:checked");
  if (boxes.length === 0) {
    say("Select at least one application first.", true);
    return;
  }
  if (!confirm("Delete " + boxes.length + " selected application(s)?")) return;

  const ids = Array.from(boxes).map(function (box) {
    return box.value;
  });
  apps = apps.filter(function (app) {
    return !ids.includes(app.id);
  });
  save();
  setDeleteMode(false);
  say("Deleted " + ids.length + " application(s).");
});

form.addEventListener("submit", function (event) {
  event.preventDefault();
  const data = new FormData(form);

  const role = String(data.get("role")).trim();
  const employer = String(data.get("employer")).trim();
  const link = String(data.get("link")).trim();

  if (!role || !employer) {
    say("Please enter a job title and an employer.", true);
    return;
  }
  if (link && !safeLink(link)) {
    say("The job link must start with http:// or https://", true);
    document.getElementById("link").focus();
    return;
  }

  const status = String(data.get("status"));
  apps.unshift({
    id: makeId(),
    role: role,
    employer: employer,
    deadline: String(data.get("deadline") || ""),
    status: Object.keys(STATUS_LABELS).includes(status) ? status : "wishlist",
    link: link,
    docs: data.getAll("docs"),
    notes: String(data.get("notes")).trim(),
    created: Date.now()
  });

  save();
  render();
  form.reset();
  say("Saved: " + role + " at " + employer + ".");
  document.getElementById("role").focus();
});

rowsEl.addEventListener("click", function (event) {
  const button = event.target.closest("button[data-id]");
  if (!button) {
    return;
  }
  const app = apps.find(function (item) {
    return item.id === button.dataset.id;
  });
  if (!app) {
    return;
  }
  if (!confirm("Delete " + app.role + " at " + app.employer + "?")) {
    return;
  }

  apps = apps.filter(function (item) {
    return item.id !== app.id;
  });
  save();
  render();
  say("Deleted: " + app.role + " at " + app.employer + ".");
  (apps.length > 0 ? tableWrap : document.getElementById("role")).focus();
});

render();


});   // ← add this line
