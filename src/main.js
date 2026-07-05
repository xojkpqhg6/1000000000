import "./style.css";
import { TARGET, MILESTONES, ITEMS } from "./data.js";

// ---------- Konstanten ----------
const CLICKS_PER_TIER = 10; // so oft klicken, bis der Multiplikator ×10 macht
const MIN_SALARY = 40_000; // hält die Batzen-Zahl (max. 25.000) darstellbar
const MAX_GRIND = 20; // ab so wenigen Rest-Klicks lassen wir das nächste ×10 weg

// ---------- Zustand ----------
const state = {
  salary: 60_000,
  built: 0, // aktuell gestapelte Batzen
  perClick: 1, // Batzen pro Klick (verzehnfacht sich)
  clicksInTier: 0, // Klicks seit dem letzten ×10
  maxPerClick: 1, // Deckel – der „letzte" Multiplikator wird weggelassen
  hitMilestones: new Set(),
  revealed: 1, // wie viele Vergleiche sind im Ausgeben-Screen sichtbar
};

// Höchsten Multiplikator bestimmen: wir hören mit dem ×10 auf, sobald der
// Rest bei der aktuellen Klick-Menge in ≤ MAX_GRIND Klicks stapelbar wäre.
// So springt der letzte Klick nicht mit einem Riesensatz über die Milliarde.
function computeMaxPerClick(target) {
  let per = 1;
  let built = 0;
  while (true) {
    const afterTier = built + per * CLICKS_PER_TIER;
    if (afterTier >= target) return per; // Ziel schon in dieser Stufe erreicht
    const remaining = target - afterTier; // Rest, wenn wir NICHT weiter ×10 gehen
    if (remaining / per <= MAX_GRIND) return per; // dann lieber auf `per` bleiben
    built = afterTier;
    per *= 10;
  }
}

const app = document.getElementById("app");

// ---------- Helfer ----------
const fmtEuro = (n) =>
  new Intl.NumberFormat("de-DE", { maximumFractionDigits: 0 }).format(n) + " €";
const fmtNum = (n) => new Intl.NumberFormat("de-DE").format(n);

const targetBatzen = () => Math.round(TARGET / state.salary);
const itemPrice = (item) => (item.lifetime ? state.salary * 40 : item.price);
const batzenFor = (value) => Math.max(1, Math.round(value / state.salary));

// Vergleiche klein → groß (damit sie „nacheinander größer werden")
const sortedItems = () =>
  [...ITEMS].sort((a, b) => itemPrice(a) - itemPrice(b));

function windowFrame(title, bodyHtml) {
  return `
    <div class="window bevel-out">
      <div class="titlebar">
        <span>💰 ${title}</span>
        <span class="dots"><span class="bevel-out">_</span><span class="bevel-out">□</span><span class="bevel-out">×</span></span>
      </div>
      <div class="window-body">${bodyHtml}</div>
    </div>`;
}

// ---------- Start-Screen ----------
function renderStart() {
  Object.assign(state, {
    built: 0,
    perClick: 1,
    clicksInTier: 0,
    hitMilestones: new Set(),
    revealed: 1,
  });

  app.innerHTML = windowFrame(
    "Wie viel ist eine Milliarde? – v0.2",
    `<div class="start">
      <h1>Eine Milliarde Euro.</h1>
      <p>Kaum vorstellbar. Machen wir sie sichtbar – gemessen an <b>deinem</b> Gehalt.<br/>
      1 Batzen = 1 Jahresgehalt. Und die musst du gleich selbst stapeln.</p>
      <div class="field bevel-in" style="padding:8px 12px;background:var(--gray)">
        <label for="salary">Dein Jahresgehalt:</label>
        <input id="salary" type="number" min="${MIN_SALARY}" step="5000" value="${state.salary}" />
        <span>€</span>
      </div>
      <div><button id="go">Los geht's ▶</button></div>
    </div>`
  );

  const input = document.getElementById("salary");
  const start = () => {
    let v = parseInt(input.value, 10);
    if (!v || v < 1) return;
    state.salary = Math.max(MIN_SALARY, v);
    state.maxPerClick = computeMaxPerClick(targetBatzen());
    renderBuild();
  };
  document.getElementById("go").addEventListener("click", start);
  input.addEventListener("keydown", (e) => e.key === "Enter" && start());
}

// ---------- Aufbauen: der User stapelt die Batzen selbst ----------
function renderBuild() {
  app.innerHTML = windowFrame(
    "Stapel deine erste Milliarde",
    `
    <div class="build">
      <div class="build-head bevel-in">
        <div class="amount" id="amount">${fmtEuro(0)}</div>
        <div class="sub">
          <span id="batzencount">0</span> von ${fmtNum(targetBatzen())} Batzen ·
          Ziel: <b>${fmtEuro(TARGET)}</b>
        </div>
        <div class="progress bevel-in"><div class="progress-fill" id="progress"></div></div>
      </div>

      <div class="build-msg" id="msg">Klick auf den Knopf und fang an zu stapeln. Ein Batzen = ${fmtEuro(
        state.salary
      )}.</div>

      <div class="build-btn-wrap">
        <button id="stack" class="big-btn">＋ <span id="perclick">1</span> Batzen stapeln</button>
      </div>

      <div class="haystack scroll95 bevel-in" id="haystack">
        <div class="grid" id="grid"></div>
      </div>
    </div>
    `
  );
  document.getElementById("stack").addEventListener("click", onStack);
}

function onStack() {
  const target = targetBatzen();
  if (state.built >= target) return;

  // Batzen dazustapeln (nicht über das Ziel hinaus)
  const add = Math.min(state.perClick, target - state.built);
  const from = state.built;
  state.built += add;
  state.clicksInTier++;
  appendBatzen(from, state.built);
  updateBuildHead();

  // Meilenstein erreicht?
  const euro = state.built * state.salary;
  for (const m of MILESTONES) {
    if (!state.hitMilestones.has(m.at) && euro >= m.at) {
      state.hitMilestones.add(m.at);
      showMilestone(m);
      if (m.final) return; // Ziel erreicht – Ende des Stapelns
    }
  }

  // Multiplikator hochziehen: alle 10 Klicks ×10 – aber nicht über den Deckel
  if (
    state.clicksInTier >= CLICKS_PER_TIER &&
    state.built < target &&
    state.perClick < state.maxPerClick
  ) {
    state.clicksInTier = 0;
    state.perClick = Math.min(state.perClick * 10, state.maxPerClick);
    document.getElementById("perclick").textContent = fmtNum(state.perClick);
    setTierMessage();
  }
}

const TIER_MESSAGES = [
  "Dauert ganz schön lange, oder? 😅 Ab jetzt gibt's <b>×10</b> pro Klick.",
  "Immer noch nicht mal in Sichtweite … <b>nochmal ×10!</b>",
  "Ehrlich? Das ist erst der Anfang. <b>×10!</b> 🚀",
  "Jetzt geht's richtig los – <b>×10!</b> Und du bist immer noch nicht da.",
  "Ok, <b>×10</b>. Langsam ahnst du, wie groß eine Milliarde ist.",
];
function setTierMessage() {
  const tier = Math.round(Math.log10(state.perClick)) - 1; // 10→0, 100→1, …
  const msg =
    TIER_MESSAGES[Math.min(tier, TIER_MESSAGES.length - 1)] ||
    "<b>×10!</b>";
  document.getElementById("msg").innerHTML = msg;
}

function updateBuildHead() {
  const target = targetBatzen();
  document.getElementById("amount").textContent = fmtEuro(
    state.built * state.salary
  );
  document.getElementById("batzencount").textContent = fmtNum(state.built);
  document.getElementById("progress").style.width =
    Math.min(100, (state.built / target) * 100) + "%";
}

// Neue Batzen ans Gitter anhängen (nur die neuen – schnell)
function appendBatzen(from, to) {
  const grid = document.getElementById("grid");
  const value = fmtEuro(state.salary);
  const frag = document.createDocumentFragment();
  for (let i = from; i < to; i++) {
    const d = document.createElement("div");
    d.className = "batzen fresh";
    d.title = `Batzen #${i + 1} · ${value}`;
    d.textContent = value;
    frag.appendChild(d);
  }
  grid.appendChild(frag);
  // frisch angehängte kurz aufblinken lassen, dann Klasse entfernen
  requestAnimationFrame(() => {
    grid.querySelectorAll(".batzen.fresh").forEach((el) =>
      el.classList.remove("fresh")
    );
  });
  // ans Ende scrollen, damit man das Wachsen sieht
  const hay = document.getElementById("haystack");
  hay.scrollTop = hay.scrollHeight;
}

// ---------- Meilenstein-Dialog ----------
function showMilestone(m) {
  const overlay = document.createElement("div");
  overlay.className = "overlay";
  overlay.innerHTML = `
    <div class="window bevel-out dialog">
      <div class="titlebar"><span>${m.emoji} Meilenstein erreicht</span></div>
      <div class="window-body dialog-body">
        <div class="ms-emoji">${m.emoji}</div>
        <h2>${m.title}</h2>
        <p>${m.text}</p>
        <div class="ms-amount">${fmtEuro(
          m.final ? TARGET : m.at
        )}</div>
        <button id="ms-ok" class="big-btn">${
          m.final ? "Jetzt ausgeben ▶" : "Weiterstapeln ▶"
        }</button>
      </div>
    </div>`;
  app.appendChild(overlay);
  document.getElementById("ms-ok").addEventListener("click", () => {
    overlay.remove();
    if (m.final) renderSpend();
  });
}

// ---------- Ausgeben: Vergleiche nacheinander freischalten ----------
function renderSpend() {
  const total = targetBatzen();

  app.innerHTML = windowFrame(
    "Eine Milliarde ausgeben – viel Spaß",
    `
    <div class="stage-head bevel-in" style="background:var(--gray)">
      <div class="amount">${fmtEuro(TARGET)}</div>
      <div class="sub">= <span class="years">${fmtNum(
        total
      )}</span> Batzen à ${fmtEuro(
      state.salary
    )} &nbsp;·&nbsp; das sind <span class="years">${fmtNum(
      total
    )} Jahre</span> arbeiten</div>
    </div>

    <div class="stage-layout">
      <div class="sidebar bevel-out">
        <div class="panel-title">Was kostet was?</div>
        <div id="itemlist" class="scroll95"></div>
        <small>Klick einen Vergleich an → so viele Batzen<br/>
        verschwinden im Stapel. Der nächste, <b>größere</b><br/>
        wird dann freigeschaltet.</small>
      </div>

      <div class="haystack-wrap bevel-out">
        <div class="panel-title">Der Stapel · ${fmtNum(total)} Batzen</div>
        <div class="haystack-info bevel-in" id="info">
          Jedes Kästchen = ${fmtEuro(
            state.salary
          )}. Fang klein an – klick den ersten Vergleich.
        </div>
        <div class="haystack scroll95 bevel-in" id="haystack">
          <div class="grid" id="grid"></div>
        </div>
      </div>
    </div>

    <div class="footer-bar">
      <button id="restart">◀ Neu starten</button>
      <span class="hint" id="hint"></span>
    </div>
    `
  );

  buildFullGrid(total);
  renderItemList();
  document.getElementById("restart").addEventListener("click", renderStart);
}

function renderItemList() {
  const list = document.getElementById("itemlist");
  const items = sortedItems();
  list.innerHTML = items
    .slice(0, state.revealed)
    .map((item, i) => {
      const price = itemPrice(item);
      const cnt = batzenFor(price);
      const isNext = i === state.revealed - 1;
      return `<button class="item bevel-out ${isNext ? "grow-in" : ""}" data-i="${i}">
        <span class="emoji">${item.emoji}</span>
        <span class="meta">
          <b>${item.name}</b>
          <small>${fmtEuro(price)} · ${fmtNum(cnt)} Batzen${
        item.hint ? ` · ${item.hint}` : ""
      }</small>
        </span>
      </button>`;
    })
    .join("");

  list.querySelectorAll(".item").forEach((btn) =>
    btn.addEventListener("click", () => spendItem(items[+btn.dataset.i], +btn.dataset.i))
  );
}

function spendItem(item, index) {
  const grid = document.getElementById("grid");
  const cells = grid.children;
  const total = cells.length;
  const price = itemPrice(item);
  const count = batzenFor(price);

  const info = document.getElementById("info");
  const hint = document.getElementById("hint");

  // vorherige Lücke zurücksetzen – immer nur EIN Vergleich sichtbar
  for (let i = 0; i < total; i++) cells[i].classList.remove("gone");

  if (count >= total) {
    for (let i = 0; i < total; i++) cells[i].classList.add("gone");
    info.innerHTML = `😳 <b>${item.emoji} ${item.name}</b> (${fmtEuro(
      price
    )}) frisst den <b>kompletten</b> Stapel.`;
  } else {
    const start = Math.floor((total - count) / 2);
    for (let i = start; i < start + count; i++) cells[i].classList.add("gone");
    const pct = ((count / total) * 100).toFixed(count / total < 0.01 ? 2 : 1);
    info.innerHTML = `🔍 <b>${item.emoji} ${item.name}</b> = <b>${fmtNum(
      count
    )}</b> von ${fmtNum(total)} Batzen · gerade mal <b>${pct}%</b> der Milliarde (${fmtEuro(
      price
    )}).`;
    hint.innerHTML = `<button id="reveal">👀 Lücke zeigen</button>`;
    document.getElementById("reveal").addEventListener("click", () => {
      cells[start].scrollIntoView({ behavior: "smooth", block: "center" });
    });
  }

  // nächsten, größeren Vergleich freischalten
  const items = sortedItems();
  if (index === state.revealed - 1 && state.revealed < items.length) {
    state.revealed++;
    renderItemList();
  } else if (state.revealed >= items.length && index === items.length - 1) {
    // alles durch – Schlusspointe
    const life = batzenFor(state.salary * 40);
    info.innerHTML += `<br/><br/>💡 Selbst die Superyacht ist nur ein Bruchteil.
      Dein ganzes <b>Arbeitsleben</b> (40 Jahre) sind ${fmtNum(
        life
      )} Batzen – ein winziger Fleck im Stapel. <b>So groß ist eine Milliarde.</b>`;
  }
}

// Volles Gitter für den Ausgeben-Screen (per DOM für Tempo)
function buildFullGrid(total) {
  const grid = document.getElementById("grid");
  const value = fmtEuro(state.salary);
  const frag = document.createDocumentFragment();
  for (let i = 0; i < total; i++) {
    const d = document.createElement("div");
    d.className = "batzen";
    d.title = `Batzen #${i + 1} · ${value}`;
    d.textContent = value;
    frag.appendChild(d);
  }
  grid.appendChild(frag);
}

// ---------- Start ----------
renderStart();
