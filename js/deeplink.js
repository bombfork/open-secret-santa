/**
 * Deep linking module for Android App Links
 * Handles incoming URLs when the app is opened via deep links
 */

// Track deep link state
let deepLinkPromise = null;

/**
 * Initialize deep link listener
 * Sets up event listener for Capacitor appUrlOpen events
 * @param {Function} onDeepLink - Callback function to handle deep link with params object
 * @returns {Promise|null} Promise that resolves when deep link is processed, or null if not available
 */
export function initDeepLinking(onDeepLink) {
  // Check if Capacitor App plugin is available (mobile environment)
  if (typeof window.Capacitor === "undefined") {
    console.log("Capacitor not available - deep linking disabled");
    return null;
  }

  // Get the App plugin from Capacitor
  const { App } = window.Capacitor.Plugins;

  if (!App) {
    console.log("Capacitor App plugin not available");
    return null;
  }

  // Create a promise that resolves when a deep link is received or times out
  deepLinkPromise = new Promise((resolve) => {
    // Check if there's a launch URL (for when app was opened with a link)
    // This handles the case where the URL was used to launch the app
    App.getLaunchUrl()
      .then((launchUrl) => {
        if (launchUrl && launchUrl.url) {
          console.log("Launch URL detected:", launchUrl.url);

          // Parse the URL to extract query parameters
          const url = new URL(launchUrl.url);
          const params = {
            data: url.searchParams.get("data"),
            admin: url.searchParams.get("admin"),
            user: url.searchParams.get("user")
              ? decodeURIComponent(url.searchParams.get("user"))
              : null,
          };

          // If we have data parameter, handle it immediately
          if (params.data) {
            console.log("Handling launch URL with data parameter");
            onDeepLink(params);
            resolve({ handled: true });
            return;
          }
        }

        // If no launch URL with data, set up listener for future deep links
        setupDeepLinkListener(resolve);
      })
      .catch((error) => {
        console.log("No launch URL or error checking:", error);
        // Set up listener even if launch URL check fails
        setupDeepLinkListener(resolve);
      });
  });

  // Helper function to set up the deep link listener
  function setupDeepLinkListener(resolve) {
    // Listen for app URL open events (for when app is already running)
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
          resolve({ handled: false });
          return;
        }

        // Call the callback with the parsed parameters
        onDeepLink(params);

        // Signal that deep link was handled
        resolve({ handled: true });
      } catch (error) {
        console.error("Error processing deep link:", error);
        resolve({ handled: false });
      }
    });

    // Timeout after 500ms if no deep link is received
    // This allows the app to proceed with normal routing
    // Increased from 100ms to 500ms to handle slower app initialization
    setTimeout(() => {
      resolve({ handled: false, timeout: true });
    }, 500);
  }

  console.log("Deep linking initialized");
  return deepLinkPromise;
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
