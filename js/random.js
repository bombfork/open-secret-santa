/**
 * Seeded random number generator using Mulberry32 algorithm
 * Provides reproducible pseudo-random numbers from a seed string
 */

/**
 * Simple string hash function (djb2)
 * @param {string} str - Input string
 * @returns {number} - Hash value
 */
function hashString(str) {
    let hash = 5381;
    for (let i = 0; i < str.length; i++) {
        hash = ((hash << 5) + hash) + str.charCodeAt(i);
        hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
}

/**
 * Mulberry32 seeded random number generator
 * @param {number} seed - Numeric seed
 * @returns {Function} - Random number generator function
 */
function mulberry32(seed) {
    return function() {
        let t = seed += 0x6D2B79F5;
        t = Math.imul(t ^ t >>> 15, t | 1);
        t ^= t + Math.imul(t ^ t >>> 7, t | 61);
        return ((t ^ t >>> 14) >>> 0) / 4294967296;
    }
}

/**
 * Create a seeded random number generator from a string
 * @param {string} seedString - Seed string
 * @returns {Function} - Random number generator function (0 to 1)
 */
export function createSeededRandom(seedString) {
    const numericSeed = hashString(seedString);
    return mulberry32(numericSeed);
}

/**
 * Fisher-Yates shuffle algorithm with seeded random
 * @param {Array} array - Array to shuffle
 * @param {Function} random - Random number generator function
 * @returns {Array} - Shuffled array (new array, original unchanged)
 */
export function shuffleArray(array, random) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

/**
 * Generate Secret Santa assignments
 * @param {string[]} participants - Array of participant names
 * @param {string} seed - Random seed string
 * @returns {Object[]} - Array of {giver, receiver} pairs
 */
export function generateAssignments(participants, seed) {
    if (participants.length < 3) {
        throw new Error('Need at least 3 participants');
    }

    const random = createSeededRandom(seed);

    // Create a shuffled copy for receivers
    const receivers = shuffleArray(participants, random);

    // Ensure no one is assigned to themselves
    // If someone got themselves, rotate the receivers
    for (let i = 0; i < participants.length; i++) {
        if (participants[i] === receivers[i]) {
            // Rotate the receivers array from this point
            const nextIndex = (i + 1) % participants.length;
            [receivers[i], receivers[nextIndex]] = [receivers[nextIndex], receivers[i]];
        }
    }

    // Create assignments
    return participants.map((giver, index) => ({
        giver: giver,
        receiver: receivers[index]
    }));
}
