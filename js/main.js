/**
 * Main application entry point
 * Handles routing and page navigation
 */

import { setupCreateForm, displayResults } from "./create.js";
import { setupViewMode } from "./view.js";
import { parseUrlParams } from "./encoder.js";
import { initI18n, t, createLanguageSelector } from "./i18n.js";
import { initDeepLinking, handleDeepLinkNavigation } from "./deeplink.js";

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
}

/**
 * Navigate to landing page and clear URL
 */
function goToLanding() {
  // Clear URL parameters but keep lang
  const url = new URL(window.location);
  const lang = url.searchParams.get("lang");
  window.history.pushState(
    {},
    "",
    window.location.pathname + (lang ? `?lang=${lang}` : ""),
  );
  showPage("landing");
}

/**
 * Show error page
 * @param {string} message - Error message to display
 */
function showError(message) {
  document.getElementById("error-message").textContent = message;
  showPage("error");

  const backBtn = document.getElementById("back-from-error");
  backBtn.addEventListener("click", goToLanding, { once: true });
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
  // Store deep link params if received before i18n is ready
  let pendingDeepLinkParams = null;

  // Initialize deep linking FIRST for Android App Links
  // This must happen before i18n to prevent language detection from interfering
  const deepLinkPromise = initDeepLinking((params) => {
    console.log("Deep link callback triggered with params:", params);
    pendingDeepLinkParams = params;
  });

  // Initialize i18n system
  await initI18n();

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

  // Wait for potential deep link before proceeding with normal routing
  // This prevents race condition where window.location is checked before deep link fires
  if (deepLinkPromise) {
    const deepLinkResult = await deepLinkPromise;

    // If deep link was handled, process it now that i18n is ready
    if (deepLinkResult.handled && pendingDeepLinkParams) {
      console.log("Processing deep link with params:", pendingDeepLinkParams);

      // Handle deep link navigation now that all dependencies are ready
      handleDeepLinkNavigation(
        pendingDeepLinkParams,
        setupViewMode,
        showPage,
        showError,
        goToLanding,
        () => t("validation.invalidUrl"),
      );

      console.log("Deep link handled, skipping normal routing");
      return;
    }

    // Otherwise, continue with normal routing
    console.log(
      deepLinkResult.timeout
        ? "No deep link received, proceeding with normal routing"
        : "Deep link not handled, proceeding with normal routing",
    );
  }

  // Parse URL parameters from window.location
  const params = parseUrlParams();

  // Check if we're in view mode (URL has parameters)
  if (params.data) {
    try {
      const viewType = setupViewMode(params, goToLanding);

      if (viewType === "participant") {
        showPage("viewParticipant");
      } else if (viewType === "admin") {
        showPage("viewAdmin");
      } else {
        showError(t("validation.invalidUrl"));
      }
    } catch (error) {
      showError(error.message);
    }
    return;
  }

  // Normal flow - show landing page
  showPage("landing");

  // Setup landing page buttons
  document.getElementById("create-btn").addEventListener("click", () => {
    // Pre-fill seed with random value
    const seedInput = document.getElementById("seed");
    if (!seedInput.value) {
      const randomSeed = Math.random().toString(36).substring(2, 15);
      seedInput.value = randomSeed;
    }
    showPage("create");
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
      showPage("results");
    },
    // On back
    () => {
      showPage("landing");
    },
  );
}

// Start the application when DOM is ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}
