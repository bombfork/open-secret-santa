/**
 * Main application entry point
 * Handles routing and page navigation
 */

import { setupCreateForm, displayResults } from './create.js';
import { setupViewMode } from './view.js';
import { parseUrlParams } from './encoder.js';

// Page elements
const pages = {
    landing: document.getElementById('landing-page'),
    create: document.getElementById('create-page'),
    results: document.getElementById('results-page'),
    viewParticipant: document.getElementById('view-participant-page'),
    viewAdmin: document.getElementById('view-admin-page'),
    error: document.getElementById('error-page')
};

/**
 * Show a specific page and hide all others
 * @param {string} pageName - Name of page to show
 */
function showPage(pageName) {
    Object.values(pages).forEach(page => page.classList.add('hidden'));
    if (pages[pageName]) {
        pages[pageName].classList.remove('hidden');
    }
}

/**
 * Navigate to landing page and clear URL
 */
function goToLanding() {
    // Clear URL parameters
    window.history.pushState({}, '', window.location.pathname);
    showPage('landing');
}

/**
 * Show error page
 * @param {string} message - Error message to display
 */
function showError(message) {
    document.getElementById('error-message').textContent = message;
    showPage('error');

    const backBtn = document.getElementById('back-from-error');
    backBtn.addEventListener('click', goToLanding, { once: true });
}

/**
 * Initialize the application
 */
function init() {
    // Parse URL parameters
    const params = parseUrlParams();

    // Check if we're in view mode (URL has parameters)
    if (params.data) {
        try {
            const viewType = setupViewMode(params, goToLanding);

            if (viewType === 'participant') {
                showPage('viewParticipant');
            } else if (viewType === 'admin') {
                showPage('viewAdmin');
            } else {
                showError('Invalid URL parameters');
            }
        } catch (error) {
            showError(error.message);
        }
        return;
    }

    // Normal flow - show landing page
    showPage('landing');

    // Setup landing page buttons
    document.getElementById('create-btn').addEventListener('click', () => {
        showPage('create');
    });

    document.getElementById('view-btn').addEventListener('click', () => {
        alert('To view your assignment, click on the personalized link that was shared with you.');
    });

    // Setup create form
    setupCreateForm(
        // On success
        (result) => {
            displayResults(result, () => {
                // Reset form and go back to landing
                document.getElementById('create-form').reset();
                goToLanding();
            });
            showPage('results');
        },
        // On back
        () => {
            showPage('landing');
        }
    );
}

// Start the application when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
