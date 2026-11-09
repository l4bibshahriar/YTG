const $ = (id) => document.getElementById(id);
const generateBtn = $("generateBtn");
let lastSettings = null;
let toastTimer;

function toast(message) {
  const el = $("toast");
  el.textContent = message;
  el.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove("show"), 2600);
}

function setLoading(loading, text = "Generating...") {
  generateBtn.disabled = loading;
  generateBtn.querySelector("span:nth-child(2)").textContent = loading ? text : "Generate names";
  generateBtn.querySelector(".btn-icon").textContent = loading ? "…" : "✦";
}

async function checkConfig() {
  try {
    const r = await fetch("/api/config");
    const data = await r.json();
    const status = $("apiStatus");
    status.classList.toggle("ready", data.configured);
    status.innerHTML = data.configured ? "<i></i> AI ready" : "<i></i> API key needed";
  } catch {
    $("apiStatus").innerHTML = "<i></i> Server offline";
  }
}

function makeCard(item, checkEnabled) {
  const card = document.createElement("article");
  card.className = "name-card";
  card.dataset.handle = item.handle;
  const top = document.createElement("div");
  top.className = "name-top";
  const info = document.createElement("div");
  info.style.minWidth = "0";
  const title = document.createElement("div");
  title.className = "name-title";
  title.textContent = item.handle;
  const handle = document.createElement("div");
  handle.className = "handle";
  handle.textContent = "youtube.com/@" + item.handle;
  info.append(title, handle);
  const actions = document.createElement("div");
  actions.className = "name-actions";
  const copy = document.createElement("button");
  copy.className = "icon-btn";
  copy.title = "Copy handle";
  copy.setAttribute("aria-label", "Copy handle");
  copy.textContent = "▢";
  copy.addEventListener("click", async () => {
    try { await navigator.clipboard.writeText("@" + item.handle); toast("Handle copied!"); }
    catch { toast("Copy isn't available in this browser."); }
  });
  const open = document.createElement("button");
  open.className = "icon-btn";
  open.title = "Open YouTube";
  open.setAttribute("aria-label", "Open YouTube handle");
  open.textContent = "↗";
  open.addEventListener("click", () => window.open("https://www.youtube.com/@" + encodeURIComponent(item.handle), "_blank", "noopener"));
  actions.append(copy, open);
  top.append(info, actions);
  const status = document.createElement("div");
  status.className = "status " + (checkEnabled ? "checking" : "unknown");
  status.innerHTML = '<span class="status-dot"></span>';
  status.append(document.createTextNode(checkEnabled ? "Checking YouTube…" : "Not checked"));
  card.append(top, status);
  return card;
}

async function generate() {
  const settings = {
    category: $("category").value,
    style: $("style").value,
    words: Number($("words").value),
    onlyNew: $("onlyNew").checked
  };
  lastSettings = settings;
  setLoading(true, "Creating ideas...");
  $("resultsSection").hidden = false;
  $("resultsGrid").innerHTML = "";
  $("resultSubtitle").textContent = "Creating names that match your style…";
  try {
    const response = await fetch("/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(settings)
    });
    let data;
    try { data = await response.json(); }
    catch { throw new Error(`Server returned an unreadable response (HTTP ${response.status}). Check the Vercel deployment and Function Logs.`); }
    if (!response.ok) throw new Error(data.error || `Could not generate names (HTTP ${response.status}).`);
    if (!Array.isArray(data.names) || data.names.length !== 10) {
      throw new Error("The generator did not return exactly 10 names. Please try again.");
    }
    const grid = $("resultsGrid");
    data.names.forEach(name => grid.append(makeCard({ handle: name }, settings.onlyNew)));
    $("resultSubtitle").textContent = `10 ideas · ${settings.category} · ${settings.style}`;
    if (settings.onlyNew) await checkNames(data.names);
  } catch (error) {
    $("resultsGrid").innerHTML = "";
    $("resultSubtitle").textContent = "Generation failed. See the error message.";
    toast(error.message || "Something went wrong. Check your Vercel Function Logs.");
  } finally {
    setLoading(false);
  }
}

async function checkNames(names) {
  setLoading(true, "Checking handles...");
  try {
    const response = await fetch("/api/check-handles", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ handles: names })
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Could not check handles.");
    const grid = $("resultsGrid");
    const byHandle = new Map(data.results.map(x => [x.handle.toLowerCase(), x]));
    [...grid.children].forEach(card => {
      const result = byHandle.get(card.dataset.handle.toLowerCase());
      if (!result) return;
      if (lastSettings?.onlyNew && result.status !== "possible") {
        card.remove();
        return;
      }
      const badge = card.querySelector(".status");
      badge.className = "status " + result.status;
      badge.innerHTML = '<span class="status-dot"></span>';
      const labels = {
        possible: "No page found · possible",
        taken: "Page found · likely taken",
        unknown: "Could not verify",
        invalid: "Invalid handle"
      };
      badge.append(document.createTextNode(labels[result.status] || "Unknown"));
      badge.title = result.message;
    });
    const count = grid.children.length;
    $("resultSubtitle").textContent = lastSettings?.onlyNew
      ? `${count} possible matches · confirm in YouTube Studio`
      : `${count} ideas checked · possible availability is not guaranteed`;
    if (lastSettings?.onlyNew && count === 0) {
      grid.innerHTML = '<div class="name-card" style="grid-column:1/-1;color:var(--muted);font-size:13px">No possible matches found in this batch. Try generating another set or turn off the availability filter.</div>';
    }
  } catch (error) {
    toast(error.message);
  } finally {
    setLoading(false);
  }
}

generateBtn.addEventListener("click", generate);
$("refreshBtn").addEventListener("click", generate);
$("themeToggle").addEventListener("click", () => {
  document.body.classList.toggle("light");
  const light = document.body.classList.contains("light");
  localStorage.setItem("ytng-theme", light ? "light" : "dark");
});
if (localStorage.getItem("ytng-theme") === "light") document.body.classList.add("light");
checkConfig();
