/**
 * Generate all Android launcher/branding assets from the pixel-art master.
 *
 * The icon is a 16x16 pixel-art gift box defined as a character grid below.
 * The script renders it into SVGs (foreground/background/full/splash), rasters
 * them with rsvg-convert, then runs @capacitor/assets to produce the Android
 * mipmaps, adaptive icon layers, and splash screens under android/app/src/.
 *
 * Usage: mise run icons   (requires rsvg-convert on PATH)
 */

import { execFileSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const res = join(root, "resources");
mkdirSync(res, { recursive: true });

const PALETTE = {
  O: "#3b1f1f", // outline
  H: "#ff8a80", // red highlight
  R: "#e53935", // red
  D: "#b71c1c", // red shade
  W: "#ffffff", // ribbon
  S: "#cfd8dc", // ribbon shade
};

const BG = "#2e7d32"; // festive green
const BG_DARK = "#142e16";

// 16x16 gift box: bow, lid, ribbon, shaded base ("." = transparent)
const GIFT = [
  "................",
  "....OO....OO....",
  "...OWWO..OWWO...",
  "...OWSWOOWSWO...",
  "....OOWWWWOO....",
  ".OOOOOOWWOOOOOO.",
  ".OHHHHHWWHHHHHO.",
  ".ORRRRRWWRRRRRO.",
  ".OOOOOOWWOOOOOO.",
  "..ORRRRWWRRRRO..",
  "..ORRRRWWRRRRO..",
  "..ORRRRWWRRRRO..",
  "..ODDDDSSDDDDO..",
  "..ODDDDSSDDDDO..",
  "..OOOOOOOOOOOO..",
  "................",
];

function giftRects() {
  const rects = [];
  GIFT.forEach((row, y) => {
    [...row].forEach((ch, x) => {
      if (ch !== ".") {
        rects.push(
          `<rect x="${x}" y="${y}" width="1" height="1" fill="${PALETTE[ch]}"/>`,
        );
      }
    });
  });
  return rects.join("\n    ");
}

function svg(size, body) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" shape-rendering="crispEdges">
  ${body}
</svg>
`;
}

// Center the 16-cell grid: scale cells so the art spans `coverage` of `size`
function centeredGift(size, coverage) {
  const cell = Math.floor((size * coverage) / 16);
  const offset = Math.round((size - cell * 16) / 2);
  return `<g transform="translate(${offset},${offset}) scale(${cell})">
    ${giftRects()}
  </g>`;
}

const bgRect = (size, color) =>
  `<rect width="${size}" height="${size}" fill="${color}"/>`;

// Adaptive foreground: art inside the ~60% safe zone of the 1024 canvas
const files = {
  "icon-foreground.svg": svg(1024, centeredGift(1024, 0.6)),
  "icon-background.svg": svg(1024, bgRect(1024, BG)),
  "icon.svg": svg(1024, bgRect(1024, BG) + centeredGift(1024, 0.72)),
  "splash.svg": svg(2732, bgRect(2732, BG) + centeredGift(2732, 0.19)),
  "splash-dark.svg": svg(2732, bgRect(2732, BG_DARK) + centeredGift(2732, 0.19)),
};

for (const [name, content] of Object.entries(files)) {
  writeFileSync(join(res, name), content);
}

const render = (from, to, size) =>
  execFileSync("rsvg-convert", ["-w", `${size}`, "-h", `${size}`, "-o", join(res, to), join(res, from)]);

render("icon-foreground.svg", "icon-foreground.png", 1024);
render("icon-background.svg", "icon-background.png", 1024);
render("icon.svg", "icon-only.png", 1024);
render("icon.svg", "playstore-icon.png", 512);
render("splash.svg", "splash.png", 2732);
render("splash-dark.svg", "splash-dark.png", 2732);

execFileSync(
  "npx",
  ["@capacitor/assets", "generate", "--android", "--assetPath", "resources"],
  { cwd: root, stdio: "inherit" },
);

console.log("Icon assets regenerated under android/app/src/main/res/");
