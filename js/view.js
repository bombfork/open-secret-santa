/**
 * View mode logic for Secret Santa (participant and admin views)
 */

import { decodeData, verifyPassword, generateParticipantUrl } from './encoder.js';
import { t } from './i18n.js';
import { escapeHtml, setupCopyButtons } from './utils.js';

/**
 * Get assignment for a specific participant
 * @param {Object[]} assignments - Array of {giver, receiver} pairs
 * @param {string} participantName - Name of participant
 * @returns {Object|null} - Assignment object or null if not found
 */
export function getAssignment(assignments, participantName) {
    return assignments.find(a => a.giver === participantName) || null;
}

/**
 * Setup participant view
 * @param {string} encodedData - Encoded data from URL
 * @param {string} participantName - Name of participant
 * @param {Function} onBack - Callback for back button
 */
export function setupParticipantView(encodedData, participantName, onBack) {
    try {
        // Decode data
        const data = decodeData(encodedData);

        // Find assignment
        const assignment = getAssignment(data.assignments, participantName);

        if (!assignment) {
            throw new Error(t('validation.noAssignmentFound', { name: participantName }));
        }

        // Display assignment
        document.getElementById('participant-name').textContent = assignment.giver;
        document.getElementById('assigned-to').textContent = assignment.receiver;

        // Setup back button
        const backBtn = document.getElementById('back-from-view');
        backBtn.addEventListener('click', onBack, { once: true });

    } catch (error) {
        throw new Error(t('validation.failedToLoad', { error: error.message }));
    }
}

/**
 * Display participant links in admin view
 * @param {string} encodedData - Encoded data from URL
 * @param {Object[]} assignments - Array of assignments
 */
function displayAdminParticipantLinks(encodedData, assignments) {
    const container = document.getElementById('admin-participant-links');
    container.innerHTML = '';

    // Get base URL
    const baseUrl = window.location.origin + window.location.pathname;

    // Get all participant names
    const participants = assignments.map(a => a.giver);

    participants.forEach(name => {
        const url = generateParticipantUrl(baseUrl, encodedData, name);

        const div = document.createElement('div');
        div.className = 'participant-link-item';
        div.innerHTML = `
            <strong>${escapeHtml(name)}:</strong>
            <input type="text" value="${escapeHtml(url)}" readonly>
            <button class="copy-btn" data-url="${escapeHtml(url)}">${t('results.copyButton')}</button>
        `;

        container.appendChild(div);
    });

    // Setup copy buttons
    setupCopyButtons();
}

/**
 * Setup admin view
 * @param {string} encodedData - Encoded data from URL (includes password hash)
 * @param {Function} onBack - Callback for back button
 */
export function setupAdminView(encodedData, onBack) {
    const unlockBtn = document.getElementById('unlock-admin');
    const passwordInput = document.getElementById('admin-password-input');
    const assignmentsDiv = document.getElementById('all-assignments');
    const backBtn = document.getElementById('back-from-admin');

    // Decode data
    let data;
    try {
        data = decodeData(encodedData);
    } catch (error) {
        throw new Error(t('validation.failedToLoad', { error: error.message }));
    }

    // Display participant links (always visible, no password needed)
    displayAdminParticipantLinks(encodedData, data.assignments);

    // Setup unlock button
    unlockBtn.addEventListener('click', () => {
        const password = passwordInput.value;

        // If password hash exists in data, verify it
        if (data.passwordHash && !verifyPassword(password, data.passwordHash)) {
            alert(t('viewAdmin.incorrectPassword'));
            passwordInput.value = '';
            passwordInput.focus();
            return;
        }

        // Display all assignments
        displayAllAssignments(data.assignments);
        assignmentsDiv.classList.remove('hidden');

        // Hide password input
        passwordInput.closest('article').style.display = 'none';
    });

    // Allow Enter key to unlock
    passwordInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            unlockBtn.click();
        }
    });

    // Setup back button
    backBtn.addEventListener('click', onBack, { once: true });
}

/**
 * Display all assignments in a table
 * @param {Object[]} assignments - Array of {giver, receiver} pairs
 */
function displayAllAssignments(assignments) {
    const tbody = document.getElementById('assignments-table');
    tbody.innerHTML = '';

    assignments.forEach(({ giver, receiver }) => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${escapeHtml(giver)}</td>
            <td>→</td>
            <td><strong>${escapeHtml(receiver)}</strong></td>
        `;
        tbody.appendChild(row);
    });
}

/**
 * Setup view mode based on URL parameters
 * This is called when the page loads with URL parameters
 * @param {Object} params - URL parameters {data, admin, user}
 * @param {Function} onBack - Callback for back button
 * @returns {string} - View type: 'participant', 'admin', or null
 */
export function setupViewMode(params, onBack) {
    if (!params.data) {
        return null;
    }

    try {
        if (params.user) {
            // Participant view
            setupParticipantView(params.data, params.user, onBack);
            return 'participant';
        } else if (params.admin) {
            // Admin view (password hash now in encoded data)
            setupAdminView(params.data, onBack);
            return 'admin';
        } else {
            // Data but no user or admin parameter - show error
            throw new Error(t('validation.invalidUrl'));
        }
    } catch (error) {
        throw error;
    }
}
