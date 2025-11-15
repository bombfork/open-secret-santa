/**
 * Shared utility functions
 */

import { t } from "./i18n.js";

/**
 * Escape HTML to prevent XSS
 * @param {string} text - Text to escape
 * @returns {string} - Escaped text
 */
export function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

/**
 * Setup copy button functionality for all copy buttons on the page
 */
export function setupCopyButtons() {
  document.querySelectorAll(".copy-btn").forEach((btn) => {
    // Remove existing listeners to avoid duplicates
    const newBtn = btn.cloneNode(true);
    btn.parentNode.replaceChild(newBtn, btn);

    newBtn.addEventListener("click", async (e) => {
      const button = e.target;
      const targetId = button.getAttribute("data-target");
      const url = button.getAttribute("data-url");

      let textToCopy;
      if (targetId) {
        // Copy from input field
        const input = document.getElementById(targetId);
        textToCopy = input.value;
      } else if (url) {
        // Copy from data attribute
        textToCopy = url;
      }

      try {
        await navigator.clipboard.writeText(textToCopy);

        // Visual feedback
        const originalText = button.textContent;
        button.textContent = t("results.copiedButton");
        button.classList.add("copied");

        setTimeout(() => {
          button.textContent = originalText;
          button.classList.remove("copied");
        }, 2000);
      } catch {
        alert(t("validation.failedToCopy"));
      }
    });
  });
}
