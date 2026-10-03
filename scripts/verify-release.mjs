import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { lstatSync, readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const site = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const root = path.join(site, "dist");
const allowed = new Set([
  "index.html", "styles.css", "app.js", "intro.js", "_headers",
  "assets/brand.png", "assets/home.png", "assets/library.png", "assets/playback.png",
  "downloads/TouchValidator-Android-0.1.10.apk",
  "downloads/TouchValidator-iOS-0.10.1.deb", "downloads/SHA256SUMS.txt"
]);
const found = new Set();
function inspect(directory) {
  for (const name of readdirSync(directory)) {
    const absolute = path.join(directory, name);
    const relative = path.relative(root, absolute).split(path.sep).join("/");
    const stat = lstatSync(absolute);
    assert(!stat.isSymbolicLink(), `Symlinks cannot be included: ${relative}`);
    if (stat.isDirectory()) inspect(absolute);
    else {
      assert(stat.isFile() && allowed.has(relative), `Unexpected publication file: ${relative}`);
      found.add(relative);
    }
  }
}
inspect(root);
assert.deepEqual(found, allowed, "A required publication file is missing");
const html = readFileSync(path.join(root, "index.html"), "utf8");
const app = readFileSync(path.join(root, "app.js"), "utf8");
const intro = readFileSync(path.join(root, "intro.js"), "utf8");
assert(!/source-download|source\.zip|c[oó]digo abierto|GPL-3\.0/i.test(html + app + intro), "Private app source must not be offered");
for (const line of readFileSync(path.join(root, "downloads/SHA256SUMS.txt"), "utf8").trim().split(/\r?\n/)) {
  const match = line.match(/^([a-f\d]{64})\s+([^/\\]+)$/i);
  assert(match, "Invalid download checksum entry");
  const [, expected, filename] = match;
  const relative = `downloads/${filename}`;
  assert(allowed.has(relative) && /\.(apk|deb)$/.test(filename), "Only installer hashes belong in the checksum file");
  const actual = createHash("sha256").update(readFileSync(path.join(root, relative))).digest("hex");
  assert.equal(actual, expected.toLowerCase(), `Installer checksum mismatch: ${filename}`);
}
console.log(`Verified ${found.size} publication files: presentation, installers and checksums only.`);
