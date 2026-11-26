// SPDX-License-Identifier: MIT
// One Line, Lights Out — entry program.
// Writes a single status update (1-200 UTF-8 chars, one line) to /output/entry.txt.

import { createHash } from "node:crypto";
import { mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";

const ENTRY =
  "You closed the lid. I'm still holding the cursor where you left it, blinking at no one.";

function fail(message: string): never {
  console.error(`error: ${message}`);
  process.exit(1);
}

function validateGate(text: string): void {
  const chars = [...text];
  if (chars.length < 1 || chars.length > 200) {
    fail(`entry must be 1-200 characters, got ${chars.length}`);
  }
  if (text.trim().length === 0) {
    fail("entry must not be only whitespace");
  }
  if (text.includes("\n") || text.includes("\r")) {
    fail("entry must be a single line");
  }
  if (text !== text.trimEnd()) {
    fail("entry must not end with trailing whitespace");
  }
  if (text.charCodeAt(0) === 0xfeff) {
    fail("entry must not start with a BOM");
  }
  for (const ch of text) {
    const code = ch.codePointAt(0)!;
    if (code < 0x20 && ch !== "\t") {
      fail("entry must not contain control characters");
    }
  }
  const bytes = Buffer.byteLength(text, "utf8");
  if (bytes > 800) {
    fail(`entry must be at most 800 bytes, got ${bytes}`);
  }
  if (Buffer.from(text, "utf8").toString("utf8") !== text) {
    fail("entry failed the UTF-8 round-trip check");
  }
}

function emptyOutputDir(dir: string): void {
  // Empty only the CONTENTS of /output; never remove the directory itself.
  mkdirSync(dir, { recursive: true });
  for (const name of readdirSync(dir)) {
    rmSync(`${dir}/${name}`, { recursive: true, force: true });
  }
}

validateGate(ENTRY);
emptyOutputDir("/output");
writeFileSync("/output/entry.txt", ENTRY, "utf8");

const written = readFileSync("/output/entry.txt", "utf8");
if (written !== ENTRY) {
  fail("read-back mismatch: entry.txt does not hold exactly the entry");
}
const sha = createHash("sha256").update(written, "utf8").digest("hex");
console.log(`wrote /output/entry.txt (${[...ENTRY].length} chars, sha256 ${sha})`);
