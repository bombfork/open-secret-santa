/**
 * Create mode logic for Secret Santa
 */

import { generateAssignments } from "./random.js";
import {
  encodeData,
  generateAdminUrl,
  generateParticipantUrl,
} from "./encoder.js";
import { t } from "./i18n.js";
import { escapeHtml, setupCopyButtons } from "./utils.js";

/**
 * Parse participant names from textarea
 * @param {string} text - Text from textarea
 * @returns {string[]} - Array of participant names (trimmed, non-empty, unique)
 */
export function parseParticipants(text) {
  const lines = text
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  // Remove duplicates
  return [...new Set(lines)];
}

/**
 * Validate create form inputs
 * @param {string[]} participants - Array of participant names
 * @param {string} seed - Random seed
 * @param {string} password - Admin password
 * @returns {Object} - {valid: boolean, error: string}
 */
export function validateInputs(participants, seed, _password) {
  if (participants.length < 3) {
    return {
      valid: false,
      error: t("validation.minParticipants"),
    };
  }

  if (participants.length > 50) {
    return {
      valid: false,
      error: t("validation.maxParticipants"),
    };
  }

  if (seed.trim().length === 0) {
    return {
      valid: false,
      error: t("validation.seedRequired"),
    };
  }

  // Password is now optional (blank passwords are allowed)

  return { valid: true };
}

/**
 * Create Secret Santa and generate URLs
 * @param {string[]} participants - Array of participant names
 * @param {string} seed - Random seed
 * @param {string} adminPassword - Admin password
 * @returns {Object} - {adminUrl, participantUrls: [{name, url}]}
 */
export function createSecretSanta(participants, seed, adminPassword) {
  // Generate assignments
  const assignments = generateAssignments(participants, seed);

  // Encode data (password hash now included in data)
  const { data } = encodeData(assignments, seed, adminPassword);

  // Get base URL (current page without query params)
  const baseUrl = window.location.origin + window.location.pathname;

  // Generate admin URL (no password hash in URL)
  const adminUrl = generateAdminUrl(baseUrl, data);

  // Generate participant URLs
  const participantUrls = participants.map((name) => ({
    name: name,
    url: generateParticipantUrl(baseUrl, data, name),
  }));

  return {
    adminUrl,
    participantUrls,
  };
}

/**
 * Setup create form event handlers
 * @param {Function} onSuccess - Callback when Secret Santa is created
 * @param {Function} onBack - Callback when back button is clicked
 */
export function setupCreateForm(onSuccess, onBack) {
  const form = document.getElementById("create-form");
  const backBtn = document.getElementById("back-to-landing");

  form.addEventListener("submit", (e) => {
    e.preventDefault();

    const participantsText = document.getElementById("participants").value;
    const seed = document.getElementById("seed").value;
    const password = document.getElementById("admin-password").value;

    // Parse and validate
    const participants = parseParticipants(participantsText);
    const validation = validateInputs(participants, seed, password);

    if (!validation.valid) {
      alert(validation.error);
      return;
    }

    try {
      // Create Secret Santa
      const result = createSecretSanta(participants, seed, password);
      onSuccess(result);
    } catch (error) {
      alert(t("validation.failedToCreate", { error: error.message }));
    }
  });

  backBtn.addEventListener("click", onBack);
}

/**
 * Display results with copy functionality
 * @param {Object} result - Result from createSecretSanta
 * @param {Function} onCreateAnother - Callback for creating another
 */
export function displayResults(result, onCreateAnother) {
  // Display admin link
  const adminLinkInput = document.getElementById("admin-link");
  adminLinkInput.value = result.adminUrl;

  // Display participant links
  const participantLinksContainer =
    document.getElementById("participant-links");
  participantLinksContainer.innerHTML = "";

  result.participantUrls.forEach(({ name, url }) => {
    const div = document.createElement("div");
    div.className = "participant-link-item";

    div.innerHTML = `
            <strong>${escapeHtml(name)}:</strong>
            <input type="text" value="${escapeHtml(url)}" readonly>
            <button class="copy-btn" data-url="${escapeHtml(url)}">${t("results.copyButton")}</button>
        `;

    participantLinksContainer.appendChild(div);
  });

  // Setup copy buttons
  setupCopyButtons();

  // Setup create another button
  const createAnotherBtn = document.getElementById("create-another");
  createAnotherBtn.addEventListener("click", onCreateAnother, { once: true });
}
