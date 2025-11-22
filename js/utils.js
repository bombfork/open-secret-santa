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
 * Copy text to clipboard using native API when available, fallback to web API
 * @param {string} text - Text to copy
 * @returns {Promise<void>}
 */
export async function copyToClipboard(text) {
  // Check if running in Capacitor (mobile app)
  if (window.Capacitor) {
    try {
      const { Clipboard } = window.Capacitor.Plugins;
      if (Clipboard) {
        await Clipboard.write({ string: text });
        return;
      }
    } catch (error) {
      // If Capacitor clipboard fails, fall back to web API
      console.warn("Native clipboard failed, falling back to web API:", error);
    }
  }

  // Fallback to web API
  await navigator.clipboard.writeText(text);
}

/**
 * Share text using native share sheet when available
 * @param {string} title - Share title
 * @param {string} text - Text to share
 * @param {string} url - URL to share
 * @returns {Promise<void>}
 */
export async function shareContent(title, text, url) {
  // Check if running in Capacitor (mobile app)
  if (window.Capacitor) {
    try {
      const { Share } = window.Capacitor.Plugins;
      if (Share) {
        await Share.share({
          title: title,
          text: text,
          url: url,
          dialogTitle: title,
        });
        return;
      }
    } catch (error) {
      // If native share fails or is cancelled, fail silently
      console.warn("Native share failed or was cancelled:", error);
      throw error;
    }
  }

  // Fallback to Web Share API if available
  if (navigator.share) {
    try {
      await navigator.share({
        title: title,
        text: text,
        url: url,
      });
      return;
    } catch (error) {
      // User cancelled or share failed
      console.warn("Web share failed or was cancelled:", error);
      throw error;
    }
  }

  // No share API available
  throw new Error("Share not supported");
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
        await copyToClipboard(textToCopy);

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

/**
 * Setup share button functionality for all share buttons on the page
 */
export function setupShareButtons() {
  document.querySelectorAll(".share-btn").forEach((btn) => {
    // Remove existing listeners to avoid duplicates
    const newBtn = btn.cloneNode(true);
    btn.parentNode.replaceChild(newBtn, btn);

    newBtn.addEventListener("click", async (e) => {
      const button = e.target;
      const url = button.getAttribute("data-url");
      const name = button.getAttribute("data-name");

      if (!url) return;

      try {
        const title = name
          ? t("results.shareTitle", { name: name })
          : t("results.shareAdminTitle");
        const text = name
          ? t("results.shareText", { name: name })
          : t("results.shareAdminText");

        await shareContent(title, text, url);
      } catch (error) {
        // Share was cancelled or failed - don't show error for cancellation
        if (error.message !== "Share not supported") {
          // Only show error if share is not supported, not if cancelled
          console.log("Share cancelled or failed:", error);
        } else {
          alert(t("validation.shareNotSupported"));
        }
      }
    });
  });
}
