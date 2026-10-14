/**
 * Deep linking module for Android App Links
 * Handles incoming URLs when the app is opened via deep links
 */

// On cold start Capacitor delivers the same URL twice: an appUrlOpen event
// (which can fire BEFORE the async getLaunchUrl() bridge call resolves) and
// the getLaunchUrl() result. Whichever path handles the URL first records it
// so the other path skips its duplicate within the window — the dedup must
// work in either order.
let handledUrl = null;
let handledUrlAt = 0;
const LAUNCH_URL_DUPLICATE_WINDOW_MS = 3000;

function wasJustHandled(url) {
  return (
    url === handledUrl &&
    Date.now() - handledUrlAt < LAUNCH_URL_DUPLICATE_WINDOW_MS
  );
}

function markHandled(url) {
  handledUrl = url;
  handledUrlAt = Date.now();
}

/**
 * Whether any deep link was handled within the dedup window.
 * Lets the router skip normal routing when the appUrlOpen listener already
 * navigated (its event can win the race against getLaunchUrl on cold start).
 * @returns {boolean}
 */
export function hasRecentlyHandledDeepLink() {
  return (
    handledUrl !== null &&
    Date.now() - handledUrlAt < LAUNCH_URL_DUPLICATE_WINDOW_MS
  );
}

/**
 * Get the Capacitor App plugin if running in a mobile environment
 * @returns {Object|null} The App plugin, or null on the web
 */
function getCapacitorApp() {
  if (typeof window.Capacitor === "undefined") {
    console.log("Capacitor not available - deep linking disabled");
    return null;
  }

  const { App } = window.Capacitor.Plugins;

  if (!App) {
    console.log("Capacitor App plugin not available");
    return null;
  }

  return App;
}

/**
 * Parse a deep link URL into routing parameters
 * @param {string} urlString - Full URL received from Capacitor
 * @returns {Object|null} {data, admin, user} params, or null if invalid or missing data
 */
function parseDeepLinkUrl(urlString) {
  try {
    const url = new URL(urlString);
    const params = {
      data: url.searchParams.get("data"),
      admin: url.searchParams.get("admin"),
      user: url.searchParams.get("user")
        ? decodeURIComponent(url.searchParams.get("user"))
        : null,
    };

    if (!params.data) {
      console.warn("Deep link missing data parameter:", urlString);
      return null;
    }

    return params;
  } catch (error) {
    console.error("Error parsing deep link:", error);
    return null;
  }
}

/**
 * Get the deep link the app was launched with, if any (cold start)
 * @returns {Promise<Object|null>} Parsed {data, admin, user} params, or null
 */
export async function getLaunchDeepLink() {
  const App = getCapacitorApp();
  if (!App) {
    return null;
  }

  try {
    const launchUrl = await App.getLaunchUrl();
    if (launchUrl && launchUrl.url) {
      console.log("Launch URL detected:", launchUrl.url);
      if (wasJustHandled(launchUrl.url)) {
        console.log("Skipping launch URL already handled by appUrlOpen");
        return null;
      }
      const params = parseDeepLinkUrl(launchUrl.url);
      if (params) {
        markHandled(launchUrl.url);
        return params;
      }
    }
  } catch (error) {
    console.log("No launch URL or error checking:", error);
  }

  return null;
}

/**
 * Initialize deep link listener
 * Registers a persistent listener for Capacitor appUrlOpen events, so links
 * tapped while the app is already running (warm start) are handled every time
 * @param {Function} onDeepLink - Callback invoked with parsed params for each deep link
 */
export function initDeepLinking(onDeepLink) {
  const App = getCapacitorApp();
  if (!App) {
    return;
  }

  App.addListener("appUrlOpen", (event) => {
    console.log("Deep link received:", event.url);

    if (wasJustHandled(event.url)) {
      console.log("Skipping appUrlOpen duplicate of handled URL");
      return;
    }

    const params = parseDeepLinkUrl(event.url);
    if (params) {
      markHandled(event.url);
      onDeepLink(params);
    }
  });

  console.log("Deep linking initialized");
}

/**
 * Initialize system back button handling (Android)
 * Without a listener, the App plugin's OnBackPressedCallback swallows the
 * press entirely once the webview can't go back — the app can never be left
 * via back. Registering one disables that default, so both directions must be
 * handled: pop the in-app history, or hand the root press back to Android.
 */
export function initNativeBackButton() {
  const App = getCapacitorApp();
  if (!App) {
    return;
  }

  App.addListener("backButton", ({ canGoBack }) => {
    if (canGoBack) {
      window.history.back();
    } else {
      // moveTaskToBack, like the system default for a root back press
      App.minimizeApp();
    }
  });
}

/**
 * Handle deep link navigation
 * Routes to the appropriate view based on URL parameters, syncing the webview
 * URL and history state so later back navigation restores the right page
 * @param {Object} params - Parsed URL parameters {data, admin, user}
 * @param {Object} options
 * @param {Function} options.setupViewMode - The setupViewMode function from view.js
 * @param {Function} options.navigate - The navigateTo function from main.js
 * @param {Function} options.showError - The showError function from main.js
 * @param {Function} options.goToLanding - The goToLanding function from main.js
 * @param {Function} options.getErrorMessage - Function to get localized error message
 * @param {boolean} options.replace - Replace the current history entry (cold start) instead of pushing (warm start)
 */
export function handleDeepLinkNavigation(
  params,
  { setupViewMode, navigate, showError, goToLanding, getErrorMessage, replace },
) {
  try {
    // Use the existing setupViewMode logic from view.js
    const viewType = setupViewMode(params, goToLanding);

    if (viewType === "participant" || viewType === "admin") {
      // Mirror the deep link's params onto the webview URL so a later
      // back/forward to this entry re-exposes them
      const url = new URL(window.location);
      const lang = url.searchParams.get("lang");
      url.search = "";
      if (lang) {
        url.searchParams.set("lang", lang);
      }
      url.searchParams.set("data", params.data);
      if (params.user) {
        // Double-encoded to match generateParticipantUrl/parseUrlParams
        url.searchParams.set("user", encodeURIComponent(params.user));
      } else if (params.admin) {
        url.searchParams.set("admin", params.admin);
      }
      navigate(viewType === "participant" ? "viewParticipant" : "viewAdmin", {
        url: url.pathname + url.search,
        replace,
      });
    } else {
      showError(getErrorMessage(), { replace });
    }
  } catch (error) {
    console.error("Error handling deep link navigation:", error);
    showError(error.message, { replace });
  }
}
