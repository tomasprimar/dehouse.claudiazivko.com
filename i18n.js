// i18n — loads translation JSON, applies to DOM, drives language switcher.
// Usage: data-i18n="dot.path.key" on any element whose textContent should translate.
//        data-i18n-placeholder="dot.path.key" for input/textarea placeholders.

const SUPPORTED = ['en', 'es', 'de', 'fr', 'sv'];
const DEFAULT_LANG = 'en';

let translations = {};
let currentLang = DEFAULT_LANG;

// Resolve a dot-path key against the loaded translations object.
// Falls back to English, then keeps the existing DOM text if nothing is loaded.
function t(key) {
  function resolve(obj, parts) {
    return parts.reduce((o, k) => (o && o[k] !== undefined ? o[k] : null), obj);
  }
  const parts = key.split('.');
  return resolve(translations[currentLang], parts)
      || resolve(translations[DEFAULT_LANG], parts)
      || null;
}

// Apply translations to all data-i18n elements in the document.
function applyTranslations() {
  document.documentElement.lang = currentLang;

  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    const value = t(key);
    if (value) el.textContent = value;
  });

  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
    const key = el.getAttribute('data-i18n-placeholder');
    const value = t(key);
    if (value) el.placeholder = value;
  });

  // Update active state on switcher buttons
  document.querySelectorAll('.lang-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.lang === currentLang);
  });
}

// Load a language JSON file, cache it, then apply.
async function loadAndApply(lang) {
  if (!SUPPORTED.includes(lang)) lang = DEFAULT_LANG;
  if (!translations[lang]) {
    try {
      const res = await fetch(`translations/${lang}.json`);
      translations[lang] = await res.json();
    } catch {
      console.warn(`i18n: failed to load ${lang}.json`);
      if (lang !== DEFAULT_LANG) { await loadAndApply(DEFAULT_LANG); return; }
    }
  }
  currentLang = lang;
  localStorage.setItem('lang', lang);
  applyTranslations();
  syncSelect(lang);
}

// Detect preferred language: localStorage → browser → default.
function detectLang() {
  const stored = localStorage.getItem('lang');
  if (stored && SUPPORTED.includes(stored)) return stored;
  const browser = (navigator.language || '').slice(0, 2).toLowerCase();
  return SUPPORTED.includes(browser) ? browser : DEFAULT_LANG;
}

// Wire up language switcher — buttons (desktop) and select (mobile).
function initSwitcher() {
  document.querySelectorAll('.lang-btn').forEach(btn => {
    btn.addEventListener('click', () => loadAndApply(btn.dataset.lang));
  });

  const select = document.querySelector('.lang-select');
  if (select) {
    select.addEventListener('change', () => loadAndApply(select.value));
  }
}

// Keep select value in sync when language changes.
function syncSelect(lang) {
  const select = document.querySelector('.lang-select');
  if (select) select.value = lang;
}

// Boot.
document.addEventListener('DOMContentLoaded', () => {
  initSwitcher();
  loadAndApply(detectLang());
});
