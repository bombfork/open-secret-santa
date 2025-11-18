/**
 * Deep linking module for Android App Links
 * Handles incoming URLs when the app is opened via deep links
 */

/**
 * Initialize deep link listener
 * Sets up event listener for Capacitor appUrlOpen events
 * @param {Function} onDeepLink - Callback function to handle deep link with params object
 */
export function initDeepLinking(onDeepLink) {
  // Check if Capacitor App plugin is available (mobile environment)
  if (typeof window.Capacitor === "undefined") {
    console.log("Capacitor not available - deep linking disabled");
    return;
  }

  // Get the App plugin from Capacitor
  const { App } = window.Capacitor.Plugins;

  if (!App) {
    console.log("Capacitor App plugin not available");
    return;
  }

  // Listen for app URL open events
  App.addListener("appUrlOpen", (event) => {
    console.log("Deep link received:", event.url);

    try {
      // Parse the URL to extract query parameters
      const url = new URL(event.url);
      const params = {
        data: url.searchParams.get("data"),
        admin: url.searchParams.get("admin"),
        user: url.searchParams.get("user")
          ? decodeURIComponent(url.searchParams.get("user"))
          : null,
      };

      // Validate that we have the required data parameter
      if (!params.data) {
        console.warn("Deep link missing data parameter:", event.url);
        return;
      }

      // Call the callback with the parsed parameters
      onDeepLink(params);
    } catch (error) {
      console.error("Error processing deep link:", error);
    }
  });

  console.log("Deep linking initialized");
}

/**
 * Handle deep link navigation
 * Routes to the appropriate view based on URL parameters
 * This is a helper function that integrates with the existing routing logic
 * @param {Object} params - Parsed URL parameters {data, admin, user}
 * @param {Function} setupViewMode - The setupViewMode function from view.js
 * @param {Function} showPage - The showPage function from main.js
 * @param {Function} showError - The showError function from main.js
 * @param {Function} goToLanding - The goToLanding function from main.js
 * @param {Function} getErrorMessage - Function to get localized error message
 */
export function handleDeepLinkNavigation(
  params,
  setupViewMode,
  showPage,
  showError,
  goToLanding,
  getErrorMessage,
) {
  try {
    // Use the existing setupViewMode logic from view.js
    const viewType = setupViewMode(params, goToLanding);

    // Navigate to the appropriate page
    if (viewType === "participant") {
      showPage("viewParticipant");
    } else if (viewType === "admin") {
      showPage("viewAdmin");
    } else {
      showError(getErrorMessage());
    }
  } catch (error) {
    console.error("Error handling deep link navigation:", error);
    showError(error.message);
  }
}
