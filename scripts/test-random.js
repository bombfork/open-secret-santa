/**
 * Unit tests for the assignment algorithm (js/random.js)
 * Run with: node scripts/test-random.js
 */

import { computeMinDistance, generateAssignments } from "../js/random.js";

let failures = 0;

function assert(condition, message) {
  if (!condition) {
    failures++;
    console.error(`  FAIL: ${message}`);
  }
}

function makeParticipants(n) {
  return Array.from({ length: n }, (_, i) => `Person${i}`);
}

// computeMinDistance follows the documented curve
const expectedDistances = [
  [3, 1],
  [4, 1],
  [5, 2],
  [9, 2],
  [10, 3],
  [14, 3],
  [15, 4],
  [19, 4],
  [20, 5],
  [50, 5],
];
console.log("computeMinDistance curve");
for (const [n, expected] of expectedDistances) {
  const actual = computeMinDistance(n);
  assert(actual === expected, `n=${n}: expected d=${expected}, got ${actual}`);
}

// Every assignment respects the minimum distance and forms a permutation
console.log("distance invariant and permutation validity");
const seeds = ["christmas", "noel2026", "a", "🎄", "seed with spaces", "42"];
const sizes = [3, 4, 5, 6, 10, 15, 20, 35, 50];
for (const n of sizes) {
  const participants = makeParticipants(n);
  const indexByName = new Map(participants.map((name, i) => [name, i]));
  const minDistance = computeMinDistance(n);

  for (const seed of seeds) {
    const assignments = generateAssignments(participants, seed);
    assert(
      assignments.length === n,
      `n=${n} seed=${seed}: expected ${n} assignments, got ${assignments.length}`,
    );

    const receivers = new Set();
    for (const { giver, receiver } of assignments) {
      receivers.add(receiver);
      const distance = Math.abs(
        indexByName.get(giver) - indexByName.get(receiver),
      );
      assert(
        distance >= minDistance,
        `n=${n} seed=${seed}: ${giver}→${receiver} distance ${distance} < ${minDistance}`,
      );
    }
    assert(
      receivers.size === n,
      `n=${n} seed=${seed}: receivers are not a permutation`,
    );
  }
}

// Same participants + same seed reproduce identical assignments
console.log("determinism");
for (const n of [3, 10, 50]) {
  const participants = makeParticipants(n);
  const first = JSON.stringify(generateAssignments(participants, "repeat"));
  const second = JSON.stringify(generateAssignments(participants, "repeat"));
  assert(first === second, `n=${n}: same seed produced different assignments`);
}

// Fewer than 3 participants is rejected
console.log("minimum participant count");
let threw = false;
try {
  generateAssignments(["A", "B"], "seed");
} catch {
  threw = true;
}
assert(threw, "expected error for 2 participants");

if (failures > 0) {
  console.error(`\n${failures} test(s) failed`);
  process.exit(1);
}
console.log("\nAll tests passed");
