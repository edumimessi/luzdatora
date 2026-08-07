const devotionalEntries = window.DEVOTIONAL_ENTRIES || [];

const elements = {
  concept: document.querySelector("#devotional-concept"),
  date: document.querySelector("#devotional-date"),
  theme: document.querySelector("#devotional-theme"),
  heading: document.querySelector("#devotional-heading"),
  verse: document.querySelector("#devotional-verse"),
  reference: document.querySelector("#devotional-reference"),
  context: document.querySelector("#devotional-context"),
  reflection: document.querySelector("#devotional-reflection"),
  action: document.querySelector("#devotional-action"),
  question: document.querySelector("#devotional-question")
};

function localCalendarDay(date = new Date()) {
  const start = new Date(date.getFullYear(), 0, 1);
  const today = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  return Math.floor((today - start) / 86400000);
}

let currentEntry = devotionalEntries.length ? localCalendarDay() % devotionalEntries.length : 0;

function renderDevotional(index) {
  const entry = devotionalEntries[index];
  if (!entry || Object.values(elements).some(element => !element)) return;
  elements.concept.textContent = entry.concept;
  elements.theme.textContent = entry.theme;
  elements.heading.textContent = entry.heading;
  elements.verse.textContent = `“${entry.verse}”`;
  elements.reference.textContent = entry.reference;
  elements.context.textContent = entry.context;
  elements.reflection.textContent = entry.reflection;
  elements.action.textContent = entry.action;
  elements.question.textContent = entry.question;
  elements.date.textContent = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "long", year: "numeric" }).format(new Date());
}

function devotionalAsText(entry) {
  return [entry.heading, "", entry.verse, entry.reference, "", `Reflexão: ${entry.reflection}`, "", `Ação: ${entry.action}`, "", `Contemplação: ${entry.question}`, "", "Luz da Torá"].join("\n");
}

function showToast(message) {
  const toast = document.querySelector("#toast");
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add("is-visible");
  clearTimeout(showToast.timeoutId);
  showToast.timeoutId = setTimeout(() => toast.classList.remove("is-visible"), 2600);
}

function initializeTheme() {
  const root = document.documentElement;
  const button = document.querySelector(".theme-button");
  const icon = document.querySelector(".theme-icon");
  const meta = document.querySelector('meta[name="theme-color"]');
  const saved = localStorage.getItem("luz-tora-theme");
  const preferred = matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  function apply(theme) {
    root.dataset.theme = theme;
    if (icon) icon.textContent = theme === "dark" ? "☀" : "☾";
    if (meta) meta.content = theme === "dark" ? "#0f1721" : "#17385f";
  }
  apply(saved || preferred);
  button?.addEventListener("click", () => {
    const next = root.dataset.theme === "dark" ? "light" : "dark";
    apply(next);
    localStorage.setItem("luz-tora-theme", next);
  });
}

function initializeMenu() {
  const button = document.querySelector(".menu-button");
  const nav = document.querySelector("#main-nav");
  if (!button || !nav) return;
  button.addEventListener("click", () => {
    const open = nav.classList.toggle("is-open");
    button.setAttribute("aria-expanded", String(open));
  });
  nav.querySelectorAll("a").forEach(link => link.addEventListener("click", () => {
    nav.classList.remove("is-open");
    button.setAttribute("aria-expanded", "false");
  }));
  document.addEventListener("click", event => {
    if (!nav.contains(event.target) && !button.contains(event.target)) {
      nav.classList.remove("is-open");
      button.setAttribute("aria-expanded", "false");
    }
  });
}

function initializeDevotionalActions() {
  document.querySelector("#next-devotional")?.addEventListener("click", () => {
    currentEntry = (currentEntry + 1) % devotionalEntries.length;
    renderDevotional(currentEntry);
  });
  document.querySelector("#copy-devotional")?.addEventListener("click", async () => {
    const text = devotionalAsText(devotionalEntries[currentEntry]);
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const area = document.createElement("textarea");
      area.value = text;
      document.body.appendChild(area);
      area.select();
      document.execCommand("copy");
      area.remove();
    }
    showToast("Reflexão copiada.");
  });
}

function slugify(value) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function ensureInteractiveStyles() {
  if (document.querySelector('link[href="interactive.css"]')) return;
  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = "interactive.css";
  document.head.appendChild(link);
}

function addCardLink(card, href, label = "Abrir estudo completo →") {
  if (!card || !href || card.dataset.interactiveCard === "true") return;
  card.dataset.interactiveCard = "true";
  card.classList.add("is-clickable");
  card.tabIndex = 0;
  card.setAttribute("role", "link");
  const link = document.createElement("a");
  link.className = "card-open-link";
  link.href = href;
  link.textContent = label;
  card.appendChild(link);
  card.addEventListener("click", event => {
    if (event.target.closest("a,button,input,label,select,textarea")) return;
    window.location.href = href;
  });
  card.addEventListener("keydown", event => {
    if ((event.key === "Enter" || event.key === " ") && !event.target.closest("a,button,input,label,select,textarea")) {
      event.preventDefault();
      window.location.href = href;
    }
  });
}

function initializeCardNavigation() {
  ensureInteractiveStyles();
  const file = window.location.pathname.split("/").pop() || "index.html";

  if (file === "parashot.html") {
    document.querySelectorAll("[data-filter-card]").forEach(card => {
      const match = card.querySelector("h3")?.textContent.match(/^(\d+)\./);
      if (match) addCardLink(card, `estudo.html?tipo=parasha&id=${match[1]}`);
    });
  }

  if (file === "tehilim.html") {
    document.querySelectorAll("[data-filter-card]").forEach(card => {
      const match = card.querySelector("h3")?.textContent.match(/^Tehilim\s+(\d+)/i);
      if (match) addCardLink(card, `estudo.html?tipo=tehilim&id=${match[1]}`);
    });
  }

  if (file === "festas.html") {
    document.querySelectorAll("#tishrei .content-card, #peregrinacao .content-card, #posteriores .content-card").forEach(card => {
      const title = card.querySelector("h3")?.textContent.trim();
      if (title) addCardLink(card, `estudo.html?tipo=festa&id=${slugify(title)}`);
    });
  }

  if (file === "index.html" || file === "") {
    document.querySelectorAll(".concept-grid article").forEach(card => {
      const title = card.querySelector("h3")?.textContent.trim();
      if (title) addCardLink(card, `estudo.html?tipo=conceito&id=${slugify(title)}`);
    });
    document.querySelectorAll(".tanakh-grid article").forEach(card => {
      const label = card.querySelector(".card-label")?.textContent.trim().toLowerCase();
      const href = label === "torá" ? "tora.html" : label === "nevi’im" ? "tanakh.html#neviim" : label === "ketuvim" ? "tanakh.html#ketuvim" : "tanakh.html";
      addCardLink(card, href, "Explorar esta seção →");
    });
  }

  if (file === "tora.html") {
    document.querySelectorAll("#livros .content-card").forEach(card => {
      if (card.id) addCardLink(card, `livro.html?livro=${encodeURIComponent(card.id)}`);
    });
  }

  if (file === "tanakh.html") {
    document.querySelectorAll(".content-card").forEach(card => {
      const title = card.querySelector("h3")?.textContent.trim();
      if (title) addCardLink(card, `estudo.html?tipo=tanakh&id=${slugify(title)}`);
    });
  }
}

function initializeServiceWorker() {
  if ("serviceWorker" in navigator) addEventListener("load", () => navigator.serviceWorker.register("sw.js").catch(() => {}));
}

renderDevotional(currentEntry);
initializeTheme();
initializeMenu();
initializeDevotionalActions();
initializeCardNavigation();
initializeServiceWorker();
const year = document.querySelector("#current-year");
if (year) year.textContent = new Date().getFullYear();
