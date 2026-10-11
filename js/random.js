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
    hash = (hash << 5) + hash + str.charCodeAt(i);
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
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
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

// Tunable minimum-distance curve: d grows with group size, capped so the
// constraint never approaches the n >= 2d feasibility limit
const DISTANCE_GROWTH_DIVISOR = 5;
const MAX_MIN_DISTANCE = 5;
const MAX_SHUFFLE_ATTEMPTS = 50000;

/**
 * Compute the enforced minimum list distance between giver and receiver
 * @param {number} participantCount - Number of participants
 * @returns {number} - Minimum distance (1 = only self-assignment excluded)
 */
export function computeMinDistance(participantCount) {
  return Math.max(
    1,
    Math.min(
      Math.floor(participantCount / DISTANCE_GROWTH_DIVISOR) + 1,
      MAX_MIN_DISTANCE,
      Math.floor((participantCount - 1) / 2),
    ),
  );
}

/**
 * Check that every giver/receiver pair respects the minimum list distance
 * @param {string[]} receivers - Shuffled receiver names
 * @param {Map<string, number>} indexByName - Participant name to list index
 * @param {number} minDistance - Minimum allowed |giverIndex - receiverIndex|
 * @returns {boolean} - True if all pairs are valid
 */
function respectsMinDistance(receivers, indexByName, minDistance) {
  for (let i = 0; i < receivers.length; i++) {
    if (Math.abs(i - indexByName.get(receivers[i])) < minDistance) {
      return false;
    }
  }
  return true;
}

/**
 * Generate Secret Santa assignments
 * Enforces a minimum distance in the entry list between giver and receiver,
 * so people entered close together (couples, families) never draw each other
 * @param {string[]} participants - Array of participant names (unique)
 * @param {string} seed - Random seed string
 * @returns {Object[]} - Array of {giver, receiver} pairs
 */
export function generateAssignments(participants, seed) {
  if (participants.length < 3) {
    throw new Error("Need at least 3 participants");
  }

  const n = participants.length;
  const minDistance = computeMinDistance(n);
  const indexByName = new Map(participants.map((name, i) => [name, i]));
  const random = createSeededRandom(seed);

  // Rejection sampling: draw seeded shuffles until one respects the distance
  let receivers = null;
  for (let attempt = 0; attempt < MAX_SHUFFLE_ATTEMPTS; attempt++) {
    const candidate = shuffleArray(participants, random);
    if (respectsMinDistance(candidate, indexByName, minDistance)) {
      receivers = candidate;
      break;
    }
  }

  // Fallback: a rotation by k in [minDistance, n - minDistance] always
  // satisfies the constraint and stays seed-deterministic
  if (receivers === null) {
    const k = minDistance + Math.floor(random() * (n - 2 * minDistance + 1));
    receivers = participants.map((_, i) => participants[(i + k) % n]);
  }

  // Create assignments
  return participants.map((giver, index) => ({
    giver: giver,
    receiver: receivers[index],
  }));
}
