/**
 * Main application entry point
 * Handles routing and page navigation
 */

import { setupCreateForm, displayResults } from "./create.js";
import { setupViewMode } from "./view.js";
import { parseUrlParams } from "./encoder.js";
import { initI18n, t, createLanguageSelector } from "./i18n.js";
import {
  initDeepLinking,
  initNativeBackButton,
  getLaunchDeepLink,
  handleDeepLinkNavigation,
  hasRecentlyHandledDeepLink,
} from "./deeplink.js";

// Page elements
const pages = {
  landing: document.getElementById("landing-page"),
  create: document.getElementById("create-page"),
  results: document.getElementById("results-page"),
  viewParticipant: document.getElementById("view-participant-page"),
  viewAdmin: document.getElementById("view-admin-page"),
  error: document.getElementById("error-page"),
};

/**
 * Show a specific page and hide all others
 * @param {string} pageName - Name of page to show
 */
function showPage(pageName) {
  Object.values(pages).forEach((page) => page.classList.add("hidden"));
  if (pages[pageName]) {
    pages[pageName].classList.remove("hidden");
  }
  // Pages share one document, so the previous page's scroll position would
  // otherwise carry over and can leave the new page's heading off-screen
  window.scrollTo(0, 0);
}

/**
 * Show a page and record it in session history so back navigation can
 * restore it (the popstate handler reads the {page} state back out)
 * @param {string} pageName - Name of page to show
 * @param {Object} [options]
 * @param {string|null} [options.url] - New URL for the entry; null keeps the current URL
 * @param {boolean} [options.replace] - Replace the current entry instead of pushing
 */
function navigateTo(pageName, { url = null, replace = false } = {}) {
  const method = replace ? "replaceState" : "pushState";
  window.history[method]({ page: pageName }, "", url);
  showPage(pageName);
}

/**
 * Navigate to landing page and clear URL
 */
function goToLanding() {
  // Clear URL parameters but keep lang
  const url = new URL(window.location);
  const lang = url.searchParams.get("lang");
  navigateTo("landing", {
    url: window.location.pathname + (lang ? `?lang=${lang}` : ""),
  });
}

/**
 * Show error page
 * @param {string} message - Error message to display
 * @param {Object} [options]
 * @param {boolean} [options.replace] - Replace the current history entry
 */
function showError(message, { replace = false } = {}) {
  document.getElementById("error-message").textContent = message;
  navigateTo("error", { replace });

  const backBtn = document.getElementById("back-from-error");
  backBtn.onclick = goToLanding;
}

/**
 * Update all page text with current language translations
 */
function updatePageText() {
  // Landing page
  document.querySelector("#landing-page h1").textContent =
    `🎅 ${t("landing.title")}`;
  document.querySelector("#landing-page p").textContent = t("landing.subtitle");
  document.querySelector("#landing-page article header strong").textContent =
    t("landing.howItWorks");

  const instructionsList = document.querySelector("#landing-page ol");
  instructionsList.innerHTML = "";
  t("landing.instructions").forEach((instruction) => {
    const li = document.createElement("li");
    li.textContent = instruction;
    instructionsList.appendChild(li);
  });

  document.querySelector(".security-notice header strong").textContent = t(
    "landing.securityNoticeTitle",
  );
  document.querySelector(".security-notice p").textContent = t(
    "landing.securityNoticeText",
  );

  document.getElementById("create-btn").textContent = t("landing.createButton");
  document.getElementById("view-btn").textContent = t("landing.viewButton");

  // Create page
  document.querySelector("#create-page h1").textContent = t("create.title");
  document.querySelector(
    'label[for="participants"]',
  ).childNodes[0].textContent = t("create.participantsLabel") + " ";
  document.querySelector('label[for="participants"] small').textContent = t(
    "create.participantsHelp",
  );
  document.getElementById("participants").placeholder = t(
    "create.participantsPlaceholder",
  );
  document.querySelector('label[for="seed"]').childNodes[0].textContent =
    t("create.seedLabel") + " ";
  document.querySelector('label[for="seed"] small').textContent =
    t("create.seedHelp");
  document.getElementById("seed").placeholder = t("create.seedPlaceholder");
  document.querySelector(
    'label[for="admin-password"]',
  ).childNodes[0].textContent = t("create.passwordLabel") + " ";
  document.querySelector('label[for="admin-password"] small').textContent = t(
    "create.passwordHelp",
  );
  document.getElementById("admin-password").placeholder = t(
    "create.passwordPlaceholder",
  );
  document.getElementById("back-to-landing").textContent =
    t("create.backButton");
  document.querySelector('#create-form button[type="submit"]').textContent = t(
    "create.submitButton",
  );

  // Results page
  document.querySelector("#results-page h1").textContent = t("results.title");
  document.querySelector(
    "#results-page article:nth-of-type(1) header strong",
  ).textContent = t("results.adminLinkTitle");
  document.querySelector(
    "#results-page article:nth-of-type(1) p small",
  ).textContent = t("results.adminLinkHelp");
  document.querySelector(
    "#results-page .link-container .copy-btn",
  ).textContent = t("results.copyButton");
  document.getElementById("share-admin-btn").textContent = t(
    "results.shareAdminButton",
  );
  document.querySelector(
    "#results-page article:nth-of-type(2) header strong",
  ).textContent = t("results.participantLinksTitle");
  document.querySelector(
    "#results-page article:nth-of-type(2) p small",
  ).textContent = t("results.participantLinksHelp");
  document.getElementById("create-another").textContent = t(
    "results.createAnotherButton",
  );

  // View participant page
  document.querySelector("#view-participant-page h1").textContent = t(
    "viewParticipant.title",
  );
  document.querySelector("#view-participant-page p").textContent = t(
    "viewParticipant.youAre",
  );
  document.querySelector("#view-participant-page footer small").textContent = t(
    "viewParticipant.keepSecret",
  );
  document.getElementById("back-from-view").textContent = t(
    "viewParticipant.backButton",
  );

  // View admin page
  document.querySelector("#view-admin-page h1").textContent =
    t("viewAdmin.title");
  document.querySelector(
    "#view-admin-page article:nth-of-type(1) header strong",
  ).textContent = t("viewAdmin.participantLinksTitle");
  document.querySelector(
    "#view-admin-page article:nth-of-type(1) p small",
  ).textContent = t("viewAdmin.participantLinksHelp");
  document.querySelector(
    'label[for="admin-password-input"]',
  ).childNodes[0].textContent = t("viewAdmin.passwordLabel") + " ";
  document.getElementById("admin-password-input").placeholder = t(
    "viewAdmin.passwordPlaceholder",
  );
  document.getElementById("unlock-admin").textContent = t(
    "viewAdmin.unlockButton",
  );
  document.querySelector("#all-assignments article header strong").textContent =
    t("viewAdmin.allAssignmentsTitle");
  document
    .querySelector("#assignments-table")
    .closest("table")
    .querySelector("th:nth-child(1)").textContent = t("viewAdmin.giverColumn");
  document
    .querySelector("#assignments-table")
    .closest("table")
    .querySelector("th:nth-child(3)").textContent = t(
    "viewAdmin.receiverColumn",
  );
  document.getElementById("back-from-admin").textContent = t(
    "viewAdmin.backButton",
  );

  // Error page
  document.querySelector("#error-page article header strong").textContent =
    t("error.title");
  document.getElementById("back-from-error").textContent =
    t("error.backButton");
}

/**
 * Initialize the application
 */
async function init() {
  // Pages are restored by showing them again, so the browser's own
  // same-document scroll restore would race showPage's scrollTo(0,0)
  window.history.scrollRestoration = "manual";

  // System/browser back: restore the page recorded in the entry's state. Only
  // show — pushing or replacing here would corrupt the history stack
  window.addEventListener("popstate", (event) => {
    const page = event.state?.page;
    showPage(page && pages[page] ? page : "landing");
  });

  // Android system back: pop the in-app history or minimize at its root
  initNativeBackButton();

  // Navigation needs translations, but the listener must be registered before
  // any await so no early appUrlOpen event is missed; gate it on i18n readiness
  let i18nReadyResolve;
  const i18nReady = new Promise((resolve) => {
    i18nReadyResolve = resolve;
  });

  // Handle deep links received while the app is running (warm start): push a
  // new entry so back returns to the page the user was on
  initDeepLinking(async (params) => {
    await i18nReady;
    handleDeepLinkNavigation(params, {
      setupViewMode,
      navigate: navigateTo,
      showError,
      goToLanding,
      getErrorMessage: () => t("validation.invalidUrl"),
      // No {page} state means this event won the cold-start race against
      // getLaunchUrl: we're still on the initial entry, so replace it and the
      // deep-linked view stays the history root
      replace: !window.history.state?.page,
    });
  });

  // Initialize i18n system
  await initI18n();
  i18nReadyResolve();

  // Setup language selector
  const languageSelectorContainer = document.getElementById(
    "language-selector-container",
  );
  createLanguageSelector(languageSelectorContainer, () => {
    updatePageText();
  });

  // Update all text with current language
  updatePageText();

  // Listen for language changes
  window.addEventListener("languagechange", () => {
    updatePageText();
  });

  // Landing and create-form listeners must be wired on every entry path: a
  // deep-link start routes straight to a view page, but "Back to Home" can
  // still land the user here
  document.getElementById("create-btn").addEventListener("click", () => {
    // Pre-fill seed with random value
    const seedInput = document.getElementById("seed");
    if (!seedInput.value) {
      const randomSeed = Math.random().toString(36).substring(2, 15);
      seedInput.value = randomSeed;
    }
    navigateTo("create");
  });

  document.getElementById("view-btn").addEventListener("click", () => {
    alert(t("alerts.viewInstructions"));
  });

  // Setup create form
  setupCreateForm(
    // On success
    (result) => {
      displayResults(result, () => {
        // Reset form and go back to landing
        document.getElementById("create-form").reset();
        goToLanding();
      });
      navigateTo("results");
    },
    // On back
    () => {
      // The create page is only ever pushed from landing, so the previous
      // entry is always landing; popping avoids growing the history stack
      window.history.back();
    },
  );

  // Cold start via Android App Link: window.location has no query params in
  // the Capacitor webview, so the launch URL must be checked explicitly
  const launchParams = await getLaunchDeepLink();
  if (launchParams) {
    // Replace: the deep-linked view is the history root, so system back
    // minimizes the app instead of walking to a never-shown landing entry
    handleDeepLinkNavigation(launchParams, {
      setupViewMode,
      navigate: navigateTo,
      showError,
      goToLanding,
      getErrorMessage: () => t("validation.invalidUrl"),
      replace: true,
    });
    return;
  }

  // The appUrlOpen listener may have already handled the launch URL (its
  // event can arrive before getLaunchUrl resolves) — normal routing would
  // stomp that navigation with the landing page
  if (hasRecentlyHandledDeepLink()) {
    return;
  }

  // Parse URL parameters from window.location
  const params = parseUrlParams();

  // Check if we're in view mode (URL has parameters)
  if (params.data) {
    try {
      const viewType = setupViewMode(params, goToLanding);

      if (viewType === "participant") {
        navigateTo("viewParticipant", { replace: true });
      } else if (viewType === "admin") {
        navigateTo("viewAdmin", { replace: true });
      } else {
        showError(t("validation.invalidUrl"), { replace: true });
      }
    } catch (error) {
      showError(error.message, { replace: true });
    }
    return;
  }

  // Normal flow - show landing page
  navigateTo("landing", { replace: true });
}

// Start the application when DOM is ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}
