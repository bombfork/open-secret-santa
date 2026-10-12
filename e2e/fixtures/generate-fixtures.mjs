/**
 * Generates deterministic deep-link fixture URLs for the Maestro e2e flows.
 *
 * Reuses the production encoder and assignment algorithm directly, so the
 * generated URLs always match the current data format. Prints a flat JSON
 * object to stdout; e2e/run.sh converts it to `maestro test -e KEY=VALUE`
 * arguments.
 */

import {
  encodeData,
  generateAdminUrl,
  generateParticipantUrl,
} from "../../js/encoder.js";
import { generateAssignments } from "../../js/random.js";

const SEED = "e2e-fixture-seed";
const PARTICIPANTS = ["Alice", "Bob", "Charlie", "Diana"];
const PASSWORD = "test-password";
const BASE_URL = "https://secret-santa.bombfork.net/";

// Known-good assignments for this seed. If random.js changes behavior, the
// fixtures must be reviewed deliberately instead of drifting silently.
const EXPECTED = {
  Alice: "Bob",
  Bob: "Charlie",
  Charlie: "Diana",
  Diana: "Alice",
};

const assignments = generateAssignments(PARTICIPANTS, SEED);

for (const { giver, receiver } of assignments) {
  if (EXPECTED[giver] !== receiver) {
    console.error(
      `Fixture drift: ${giver} -> ${receiver}, expected ${giver} -> ${EXPECTED[giver]}.`,
    );
    console.error(
      "The assignment algorithm changed. Update EXPECTED in this file and review the e2e flows.",
    );
    process.exit(1);
  }
}

const { data } = encodeData(assignments, SEED, PASSWORD);

process.stdout.write(
  JSON.stringify({
    PARTICIPANT_URL: generateParticipantUrl(BASE_URL, data, "Alice"),
    ADMIN_URL: generateAdminUrl(BASE_URL, data),
    GIVER_NAME: "Alice",
    RECEIVER_NAME: "Bob",
    ADMIN_PASSWORD: PASSWORD,
  }),
);
