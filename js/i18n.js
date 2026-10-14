/**
 * Internationalization (i18n) module for Secret Santa
 * Handles language switching, translation loading, and text replacement
 */

// Available languages with their flag emojis
export const LANGUAGES = {
  en: { name: "English", flag: "🇬🇧" },
  fr: { name: "Français", flag: "🇫🇷" },
  es: { name: "Español", flag: "🇪🇸" },
  de: { name: "Deutsch", flag: "🇩🇪" },
  ca: { name: "Català", flag: "🏴" },
  it: { name: "Italiano", flag: "🇮🇹" },
  pt: { name: "Português", flag: "🇵🇹" },
  nl: { name: "Nederlands", flag: "🇳🇱" },
  pl: { name: "Polski", flag: "🇵🇱" },
  ru: { name: "Русский", flag: "🇷🇺" },
  ja: { name: "日本語", flag: "🇯🇵" },
  zh: { name: "中文", flag: "🇨🇳" },
  eu: { name: "Euskara", flag: "🏴" },
  gl: { name: "Galego", flag: "🏴" },
  oc: { name: "Occitan", flag: "🏴" },
  tlh: { name: "tlhIngan Hol", flag: "🖖" },
  sjn: { name: "Sindarin", flag: "🧝" },
  qya: { name: "Quenya", flag: "✨" },
};

const DEFAULT_LANGUAGE = "en";
const STORAGE_KEY = "secretsanta_language";

let currentLanguage = DEFAULT_LANGUAGE;
let translations = {};

/**
 * Get browser language preference
 * @returns {string} - Language code (e.g., 'en', 'fr')
 */
function getBrowserLanguage() {
  const browserLang = navigator.language || navigator.userLanguage;
  const langCode = browserLang.split("-")[0]; // Get base language (e.g., 'en' from 'en-US')
  return LANGUAGES[langCode] ? langCode : DEFAULT_LANGUAGE;
}

/**
 * Get stored language preference or detect from browser
 * @returns {string} - Language code
 */
function getInitialLanguage() {
  // Check localStorage first
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored && LANGUAGES[stored]) {
    return stored;
  }

  // Check URL parameter
  const urlParams = new URLSearchParams(window.location.search);
  const urlLang = urlParams.get("lang");
  if (urlLang && LANGUAGES[urlLang]) {
    return urlLang;
  }

  // Fall back to browser language
  return getBrowserLanguage();
}

/**
 * Load translation file for a specific language
 * @param {string} lang - Language code
 * @returns {Promise<Object>} - Translation object
 */
async function loadTranslations(lang) {
  try {
    const response = await fetch(`locales/${lang}.json`);
    if (!response.ok) {
      throw new Error(`Failed to load ${lang} translations`);
    }
    return await response.json();
  } catch (error) {
    console.error(`Error loading translations for ${lang}:`, error);
    // Fall back to English
    if (lang !== DEFAULT_LANGUAGE) {
      return await loadTranslations(DEFAULT_LANGUAGE);
    }
    return {};
  }
}

/**
 * Get translation value by key path
 * @param {string} keyPath - Dot-separated key path (e.g., 'landing.title')
 * @param {Object} replacements - Optional key-value pairs for placeholder replacement
 * @returns {string} - Translated text
 */
export function t(keyPath, replacements = {}) {
  const keys = keyPath.split(".");
  let value = translations;

  for (const key of keys) {
    if (value && typeof value === "object" && key in value) {
      value = value[key];
    } else {
      console.warn(`Translation key not found: ${keyPath}`);
      return keyPath;
    }
  }

  // Handle arrays (return as is)
  if (Array.isArray(value)) {
    return value;
  }

  // Handle string replacements
  if (typeof value === "string") {
    let result = value;
    for (const [key, replacement] of Object.entries(replacements)) {
      result = result.replace(`{${key}}`, replacement);
    }
    return result;
  }

  return value;
}

/**
 * Get current language code
 * @returns {string} - Current language code
 */
export function getCurrentLanguage() {
  return currentLanguage;
}

/**
 * Set language and load translations
 * @param {string} lang - Language code
 * @returns {Promise<void>}
 */
export async function setLanguage(lang) {
  if (!LANGUAGES[lang]) {
    console.error(`Unsupported language: ${lang}`);
    return;
  }

  currentLanguage = lang;
  translations = await loadTranslations(lang);

  // Save to localStorage
  localStorage.setItem(STORAGE_KEY, lang);

  // Update URL parameter (without reloading); keep the {page} history state
  // used by back navigation
  const url = new URL(window.location);
  url.searchParams.set("lang", lang);
  window.history.replaceState(window.history.state, "", url);

  // Dispatch custom event for language change
  window.dispatchEvent(new CustomEvent("languagechange", { detail: { lang } }));
}

/**
 * Initialize i18n system
 * @returns {Promise<void>}
 */
export async function initI18n() {
  const lang = getInitialLanguage();
  await setLanguage(lang);
}

/**
 * Create language selector UI
 * @param {HTMLElement} container - Container element for language selector
 * @param {Function} onChange - Callback when language changes
 */
export function createLanguageSelector(container, onChange) {
  const wrapper = document.createElement("div");
  wrapper.className = "language-selector";
  wrapper.setAttribute("role", "navigation");
  wrapper.setAttribute("aria-label", "Language selector");

  const select = document.createElement("select");
  // Chromium exposes HTML ids as resource-ids, which the e2e flows tap on
  select.id = "language-select";
  select.className = "language-dropdown";
  select.setAttribute("aria-label", "Select language");

  for (const [code, { name, flag }] of Object.entries(LANGUAGES)) {
    const option = document.createElement("option");
    option.value = code;
    option.textContent = `${flag} ${name}`;

    if (code === currentLanguage) {
      option.selected = true;
    }

    select.appendChild(option);
  }

  select.addEventListener("change", async (e) => {
    const code = e.target.value;
    await setLanguage(code);

    // Call onChange callback
    if (onChange) {
      onChange(code);
    }
  });

  wrapper.appendChild(select);
  container.appendChild(wrapper);
}
