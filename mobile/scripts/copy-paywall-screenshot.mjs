import { cpSync, existsSync, mkdirSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const root = join(import.meta.dirname, "..");
const screenshotsDir = join(root, "assets", "screenshots");
const dest = join(root, "assets", "subscription-review-screenshot.png");

function findPaywallPng(dir) {
  if (!existsSync(dir)) return null;
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      const nested = findPaywallPng(full);
      if (nested) return nested;
      continue;
    }
    if (entry.endsWith(".png") && entry.includes("paywall")) return full;
  }
  return null;
}

const source = findPaywallPng(screenshotsDir);
if (!source) {
  console.error("No paywall screenshot found under assets/screenshots. Run snapscene first.");
  process.exit(1);
}

mkdirSync(join(root, "assets"), { recursive: true });
cpSync(source, dest);
console.log(`Copied ${source} -> ${dest}`);
