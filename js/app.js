// ════════════════════════════════════════════════════════════
// JAGA-JAGA! — app logic
// APIs (all listed on pasarapi.xyz, all free, no key needed):
//   1. MET Malaysia Weather Forecast  — GET api.data.gov.my/weather/forecast
//   2. MET Malaysia Weather Warnings  — GET api.data.gov.my/weather/warning
//      + earthquake                   — GET api.data.gov.my/weather/warning/earthquake
//   3. Data Catalogue (fuel prices)   — GET api.data.gov.my/data-catalogue?id=fuelprice
// ════════════════════════════════════════════════════════════

const API = "https://api.data.gov.my";
const STORE_KEY = "jagajaga_v1";

// ── quick-pick locations (MET Malaysia forecast towns) ──
const QUICK_LOCS = [
  "Kuala Lumpur", "Petaling Jaya", "Shah Alam", "Johor Bahru", "Ipoh",
  "George Town", "Kuantan", "Kota Bharu", "Alor Setar", "Melaka",
  "Seremban", "Kuala Terengganu", "Kangar", "Kuching", "Kota Kinabalu",
  "Putrajaya", "Labuan",
];

// ── BM forecast text → category + emoji + EN gloss ──
function classifyForecast(bm = "") {
  const s = bm.toLowerCase();
  if (s.includes("ribut")) return { cat: "storm", emoji: "⛈️", en: "Thunderstorms" };
  if (s.includes("tiada hujan") || s.includes("cerah")) return { cat: "clear", emoji: "☀️", en: "No rain" };
  if (s.includes("hujan")) return { cat: "rain", emoji: "🌧️", en: "Rain" };
  if (s.includes("jerebu")) return { cat: "haze", emoji: "🌫️", en: "Hazy" };
  if (s.includes("berawan") || s.includes("mendung")) return { cat: "cloudy", emoji: "☁️", en: "Cloudy" };
  if (s.trim() === "") return { cat: "cloudy", emoji: "🌤️", en: "—" };
  return { cat: "cloudy", emoji: "🌤️", en: bm };
}

const DAY_NAMES = ["Ahad", "Isnin", "Selasa", "Rabu", "Khamis", "Jumaat", "Sabtu"];

// ── game state ──
const defaultState = {
  xp: 0,
  streak: 0,
  lastCheckIn: null,       // "YYYY-MM-DD"
  location: "Kuala Lumpur",
  visitedLocations: [],
  badges: [],
  prediction: null,        // { targetDate, guess, location }
  correctPredictions: 0,
};
let state = loadState();

function loadState() {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    return raw ? { ...defaultState, ...JSON.parse(raw) } : { ...defaultState };
  } catch { return { ...defaultState }; }
}
function saveState() {
  try { localStorage.setItem(STORE_KEY, JSON.stringify(state)); } catch { /* private mode */ }
}

const RANKS = [
  { min: 0, name: "Budak Baru" },
  { min: 100, name: "Kaki Cuaca" },
  { min: 250, name: "Otai Cuaca" },
  { min: 500, name: "Legenda Pasar" },
];
const BADGES = [
  { id: "first",    emoji: "👣", name: "First Jalan",  desc: "Buka app buat kali pertama" },
  { id: "streak3",  emoji: "🔥", name: "3-Day Chain",  desc: "Check in 3 hari berturut" },
  { id: "streak7",  emoji: "🐉", name: "Naga Streak",  desc: "Check in 7 hari berturut" },
  { id: "peramal",  emoji: "🔮", name: "Peramal",      desc: "Teka cuaca betul" },
  { id: "explorer", emoji: "🗺️", name: "Jalan-Jalan",  desc: "Semak 3 lokasi berbeza" },
  { id: "otai",     emoji: "👑", name: "Otai",         desc: "Capai 250 XP" },
];

// ── tiny helpers ──
const $ = (id) => document.getElementById(id);
const todayStr = () => new Date().toLocaleDateString("en-CA"); // YYYY-MM-DD local
function dateStrOffset(days) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toLocaleDateString("en-CA");
}
function toast(msg) {
  const t = $("toast");
  t.textContent = msg;
  t.classList.add("show");
  clearTimeout(t._h);
  t._h = setTimeout(() => t.classList.remove("show"), 2600);
}
async function getJSON(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const j = await res.json();
  return Array.isArray(j) ? j : (j.data ?? j.results ?? []);
}

// ── XP / rank ──
function addXP(amount, why) {
  const beforeRank = rankFor(state.xp).name;
  state.xp += amount;
  const afterRank = rankFor(state.xp).name;
  saveState();
  renderXP();
  toast(`+${amount} XP — ${why}`);
  if (afterRank !== beforeRank) setTimeout(() => toast(`🎉 RANK UP: ${afterRank}!`), 2800);
  if (state.xp >= 250) earnBadge("otai");
}
function rankFor(xp) {
  let r = RANKS[0];
  for (const rank of RANKS) if (xp >= rank.min) r = rank;
  return r;
}
function renderXP() {
  const r = rankFor(state.xp);
  const next = RANKS.find((x) => x.min > state.xp);
  const pct = next ? Math.min(100, ((state.xp - r.min) / (next.min - r.min)) * 100) : 100;
  $("xp-rank").textContent = r.name;
  $("xp-num").textContent = `${state.xp} XP`;
  $("xp-fill").style.width = pct + "%";
}

// ── badges ──
function earnBadge(id) {
  if (state.badges.includes(id)) return;
  state.badges.push(id);
  saveState();
  const b = BADGES.find((x) => x.id === id);
  if (b) toast(`🏅 Badge unlocked: ${b.name}!`);
  renderBadges();
}
function renderBadges() {
  $("badge-grid").innerHTML = BADGES.map((b) => `
    <div class="badge ${state.badges.includes(b.id) ? "earned" : ""}" title="${b.desc}">
      <span class="badge-emoji">${b.emoji}</span>
      <span class="badge-name">${b.name}</span>
    </div>`).join("");
}

// ── check-in / streak ──
function renderCheckIn() {
  const done = state.lastCheckIn === todayStr();
  $("streak-count").textContent = state.streak;
  $("streak-flame").classList.toggle("lit", state.streak > 0);
  const btn = $("checkin-btn");
  btn.disabled = done;
  btn.textContent = done ? "Dah check in ✓" : "Check in +20 XP";
}
$("checkin-btn").addEventListener("click", () => {
  const today = todayStr();
  if (state.lastCheckIn === today) return;
  state.streak = state.lastCheckIn === dateStrOffset(-1) ? state.streak + 1 : 1;
  state.lastCheckIn = today;
  saveState();
  addXP(20, "daily check-in");
  if (state.streak >= 3) earnBadge("streak3");
  if (state.streak >= 7) earnBadge("streak7");
  renderCheckIn();
});

// ══════════ API 1: WEATHER FORECAST ══════════
let sky = null; // 3D scene controller
let latestForecast = []; // [{date, summary, min, max, cls}]

async function loadForecast(locationName) {
  $("now-line").textContent = "Loading cuaca…";
  $("forecast-strip").innerHTML = `<div class="fc-card fc-loading">…</div>`;
  try {
    const url = `${API}/weather/forecast?contains=${encodeURIComponent(locationName)}@location__location_name`;
    let rows = await getJSON(url);
    if (!rows.length) throw new Error("no-location");

    // prefer exact name match if several locations returned
    const exact = rows.filter(
      (r) => (r.location?.location_name || "").toLowerCase() === locationName.toLowerCase()
    );
    const useRows = exact.length ? exact : rows;
    const realName = useRows[0]?.location?.location_name || locationName;

    // dedupe by date, keep from today onwards, sort, take 7
    const byDate = new Map();
    for (const r of useRows) if (r.date && !byDate.has(r.date)) byDate.set(r.date, r);
    const today = todayStr();
    latestForecast = [...byDate.values()]
      .filter((r) => r.date >= today)
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(0, 7)
      .map((r) => ({
        date: r.date,
        summary: r.summary_forecast || r.afternoon_forecast || "",
        min: r.min_temp, max: r.max_temp,
        cls: classifyForecast(r.summary_forecast || r.afternoon_forecast || ""),
      }));
    if (!latestForecast.length) throw new Error("no-days");

    // HUD
    const t0 = latestForecast[0];
    $("loc-btn").textContent = `${realName} ▾`;
    $("temp-big").textContent = (t0.max ?? "--") + "°";
    $("temp-small").textContent = `min ${t0.min ?? "--"}°`;
    $("now-line").textContent = `${t0.cls.emoji} ${t0.summary || t0.cls.en} · ${t0.cls.en}`;

    // 3D sky follows today's real forecast + real local time
    const hour = new Date().getHours();
    const isNight = hour < 7 || hour >= 19;
    if (sky) sky.setWeather(t0.cls.cat === "haze" ? "haze" : t0.cls.cat, isNight);
    document.getElementById("diorama-fallback").style.background =
      isNight ? "linear-gradient(180deg,#0a1422,#14243c)" : "linear-gradient(180deg,#2b6cb8,#6fa8dc)";

    // strip
    $("forecast-strip").innerHTML = latestForecast.map((d, i) => {
      const day = new Date(d.date + "T00:00:00");
      return `<div class="fc-card ${i === 0 ? "today" : ""}">
        <span class="fc-day">${i === 0 ? "HARI NI" : DAY_NAMES[day.getDay()].toUpperCase()}</span>
        <span class="fc-emoji">${d.cls.emoji}</span>
        <span class="fc-temp">${d.min ?? "–"}°–${d.max ?? "–"}°</span>
        <div class="fc-desc">${d.summary || d.cls.en}</div>
      </div>`;
    }).join("");

    // explorer badge
    if (!state.visitedLocations.includes(realName)) {
      state.visitedLocations.push(realName);
      saveState();
      if (state.visitedLocations.length >= 3) earnBadge("explorer");
    }

    resolvePrediction(); // check pending guess against fresh data
  } catch (e) {
    $("now-line").textContent = "Tak jumpa lokasi tu 😅 — cuba nama bandar lain (cth: Kuala Lumpur).";
    $("forecast-strip").innerHTML = `<div class="fc-card fc-loading">Takde data. Cuba lokasi lain.</div>`;
  }
}

// ══════════ API 2: WARNINGS + EARTHQUAKE ══════════
async function loadWarnings() {
  const list = $("alerts-list");
  try {
    const [warns, quakes] = await Promise.allSettled([
      getJSON(`${API}/weather/warning?limit=10`),
      getJSON(`${API}/weather/warning/earthquake?limit=5`),
    ]);
    const now = new Date();
    const cards = [];

    if (warns.status === "fulfilled") {
      for (const w of warns.value) {
        const validTo = w.valid_to ? new Date(w.valid_to) : null;
        if (validTo && validTo < now) continue; // expired
        const title = w.warning_issue?.title_en || w.warning_issue?.title_bm || w.heading_en || "Weather warning";
        const text = w.text_en || w.text_bm || "";
        const instr = w.instruction_en || "";
        cards.push(`
          <div class="alert-card alert-danger">
            <span class="alert-title">⚠️ ${escapeHTML(title)}</span>
            ${text ? `<span>${escapeHTML(text).slice(0, 220)}${text.length > 220 ? "…" : ""}</span>` : ""}
            ${instr ? `<span class="alert-meta">📢 ${escapeHTML(instr).slice(0, 140)}</span>` : ""}
            ${w.valid_to ? `<span class="alert-meta">Valid until ${new Date(w.valid_to).toLocaleString("en-MY")}</span>` : ""}
          </div>`);
      }
    }
    if (quakes.status === "fulfilled") {
      for (const q of quakes.value.slice(0, 2)) {
        const when = q.utcdatetime || q.localdatetime || "";
        const mag = q.magdefault ?? q.magnitude ?? "";
        const loc = q.location_original || q.location || q.n_landmark_name || "";
        // only surface quakes from the last 3 days
        const ts = when ? new Date(when) : null;
        if (ts && now - ts > 3 * 86400_000) continue;
        cards.push(`
          <div class="alert-card alert-danger">
            <span class="alert-title">🌏 Earthquake ${mag ? "M" + mag : ""}</span>
            <span>${escapeHTML(String(loc))}</span>
            ${when ? `<span class="alert-meta">${escapeHTML(String(when))}</span>` : ""}
          </div>`);
      }
    }

    list.innerHTML = cards.length
      ? cards.join("")
      : `<div class="alert-card alert-clear">✅ <strong>All clear!</strong> Takde amaran aktif dari MET Malaysia sekarang. Syok je hari ni.</div>`;
  } catch {
    list.innerHTML = `<div class="alert-card alert-loading">Tak dapat load amaran sekarang — cuba refresh.</div>`;
  }
}

// ══════════ API 3: FUEL PRICES (Data Catalogue) ══════════
async function loadFuel() {
  const grid = $("fuel-grid");
  try {
    const rows = await getJSON(`${API}/data-catalogue?id=fuelprice`);
    // keep weekly "level" rows if the dataset carries both level & change series
    const levels = rows.filter((r) => !r.series_type || r.series_type === "level");
    levels.sort((a, b) => String(a.date).localeCompare(String(b.date)));
    const latest = levels[levels.length - 1];
    const prev = levels[levels.length - 2] || {};
    if (!latest) throw new Error("no-fuel");

    $("fuel-week").textContent = `minggu ${latest.date}`;
    const items = [
      { key: "ron95", label: "RON95", cls: "" },
      { key: "ron97", label: "RON97", cls: "ron97" },
      { key: "diesel", label: "DIESEL", cls: "diesel" },
    ];
    grid.innerHTML = items.map(({ key, label, cls }) => {
      const cur = Number(latest[key]);
      const old = Number(prev[key]);
      const delta = isFinite(cur) && isFinite(old) ? cur - old : 0;
      const dCls = delta > 0 ? "delta-up" : delta < 0 ? "delta-down" : "delta-flat";
      const dTxt = delta > 0 ? `▲ +${delta.toFixed(2)}` : delta < 0 ? `▼ ${delta.toFixed(2)}` : "— sama";
      return `<div class="fuel-card ${cls}">
        <div class="fuel-name">${label}</div>
        <div class="fuel-price">RM ${isFinite(cur) ? cur.toFixed(2) : "–"}<small>/L</small></div>
        <div class="fuel-delta ${dCls}">${dTxt} vs last week</div>
      </div>`;
    }).join("");
  } catch {
    grid.innerHTML = `<div class="fuel-card fuel-loading">Tak dapat load harga minyak — cuba refresh.</div>`;
  }
}

// ══════════ TEKA CUACA (prediction game) ══════════
function renderGame() {
  const p = state.prediction;
  const opts = $("game-options");
  const status = $("game-status");
  if (p && p.targetDate > todayStr()) {
    opts.querySelectorAll("button").forEach((b) => {
      b.disabled = true;
      b.classList.toggle("picked", b.dataset.guess === p.guess);
    });
    status.textContent = `Teka kau: ${labelFor(p.guess)} untuk esok kat ${p.location}. Datang balik esok untuk result! 👀`;
  } else {
    opts.querySelectorAll("button").forEach((b) => { b.disabled = false; b.classList.remove("picked"); });
    status.textContent = "";
  }
}
function labelFor(g) { return { clear: "☀️ Cerah", rain: "🌧️ Hujan", storm: "⛈️ Ribut Petir" }[g] || g; }

$("game-options").addEventListener("click", (e) => {
  const btn = e.target.closest("button[data-guess]");
  if (!btn || btn.disabled) return;
  state.prediction = { targetDate: dateStrOffset(1), guess: btn.dataset.guess, location: state.location };
  saveState();
  renderGame();
  toast("Teka locked in! Jumpa esok 🤝");
});

function resolvePrediction() {
  const p = state.prediction;
  if (!p || p.targetDate > todayStr()) return;
  if (p.location !== state.location) return; // resolve only on same location's data
  const dayData = latestForecast.find((d) => d.date === p.targetDate);
  if (!dayData) { state.prediction = null; saveState(); renderGame(); return; }
  const actual = dayData.cls.cat === "haze" || dayData.cls.cat === "cloudy" ? "clear" : dayData.cls.cat;
  state.prediction = null;
  if (actual === p.guess) {
    state.correctPredictions += 1;
    saveState();
    addXP(50, "teka cuaca BETUL! 🔮");
    earnBadge("peramal");
    $("game-status").textContent = `Padu! Memang ${labelFor(p.guess)} hari tu. +50 XP 🔥`;
  } else {
    saveState();
    addXP(10, "teka salah, tapi effort ada");
    $("game-status").textContent = `Alamak, jawapan sebenar: ${labelFor(actual)}. +10 XP consolation 😅`;
  }
  renderGame();
}

// ══════════ LOCATION PICKER ══════════
const dialog = $("loc-dialog");
$("loc-btn").addEventListener("click", () => {
  $("loc-chips").innerHTML = QUICK_LOCS.map(
    (l) => `<button type="button" class="loc-chip" data-loc="${l}">${l}</button>`
  ).join("");
  $("loc-search").value = "";
  dialog.showModal();
});
dialog.addEventListener("click", (e) => {
  const chip = e.target.closest(".loc-chip");
  if (chip) {
    setLocation(chip.dataset.loc);
    dialog.close();
  }
});
$("loc-cancel").addEventListener("click", () => dialog.close("cancel"));
dialog.addEventListener("close", () => {
  if (dialog.returnValue === "go") {
    const q = $("loc-search").value.trim();
    if (q) setLocation(q);
  }
});
function setLocation(name) {
  state.location = name;
  saveState();
  loadForecast(name);
}

function escapeHTML(s) {
  return String(s).replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

// ══════════ BOOT ══════════
async function boot() {
  renderXP();
  renderBadges();
  renderCheckIn();
  renderGame();
  if (!state.badges.includes("first")) {
    earnBadge("first");
    addXP(10, "welcome to JAGA-JAGA!");
  }

  // 3D scene (graceful fallback if WebGL/CDN unavailable)
  try {
    const { createSkyDiorama } = await import("./scene.js");
    sky = createSkyDiorama($("sky-canvas"));
  } catch {
    document.getElementById("diorama").classList.add("no-webgl");
  }

  loadForecast(state.location);
  loadWarnings();
  loadFuel();
}
boot();
