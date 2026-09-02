/**
 * check-claims — the figure rule, enforced rather than remembered.
 *
 * The internal use-cases page this site was built from carried percentages, per-run
 * durations and outcome counts. They were illustrative there and would be unsourced
 * advertising claims here, so they were stripped once. Stripping once is a state of
 * a file; this is the check that keeps it a property of the repo.
 *
 * WHAT IT ASSERTS
 *   0. The extractor can actually see the card data      (a blind reader reports "clean")
 *   1. The detector bites, against a known-bad fixture   (a detector that matches nothing passes everything)
 *   2. No digits in any illustrative mock-up
 *   3. No durations, rates or percentages in card copy
 *   4. No pricing / trial / licensing vocabulary anywhere on the site
 *   5. The connector list still carries its provenance
 *
 * Sections 0 and 1 exist because the other three are negative assertions, and a
 * negative assertion passes loudest when the thing doing the looking is broken.
 * Verdict comes from the exit code; `process.exitCode` (never `process.exit()`) so
 * the event loop drains and the printed verdict and the exit code cannot disagree.
 */

import { readFileSync, readdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const failures = [];
const fail = (msg) => { failures.push(msg); console.log(`  FAIL  ${msg}`); };
const pass = (msg) => console.log(`  ok    ${msg}`);
const section = (n, title) => console.log(`\n${n}. ${title}`);

const read = (rel) => readFileSync(join(ROOT, rel), 'utf8');

// --- detectors ------------------------------------------------------------
// Kept as named functions so section 1 can point them at a fixture rather than
// at the tree. A detector only ever tested against clean input is untested.

/**
 * Digits a READER would see, plus digits in style attributes.
 *
 * Naively counting /\d/ over the raw mark-up reports the `4` in every `<h4>` tag
 * and buries the real hits — the first run of this check produced twelve such
 * "findings", which is the shape a genuine regression would have had. Tag names
 * are markup, not claims. Style attributes are, though: the percentages being
 * hunted here lived in `style="width:72%"`, so they are scanned separately
 * rather than stripped along with the tags.
 */
const digitsIn = (s) => {
  const text = s.replace(/<[^>]*>/g, ' ');
  const styles = [...s.matchAll(/style\s*=\s*"([^"]*)"/gi)].map((m) => m[1]).join(' ');
  return `${text} ${styles}`.match(/\d/g) ?? [];
};

const RATE = /\b\d+(\.\d+)?\s*(%|per\s?cent|min|mins|minutes?|hrs?|hours?|secs?|seconds?|x\b)/gi;
const ratesIn = (s) => s.match(RATE) ?? [];

/**
 * A pricing OFFER, not the word "pricing".
 *
 * A use case about researching a competitor legitimately says "gathers pricing,
 * positioning and product changes". Banning the word outright flags that and
 * teaches the reader to skip this section. What must never appear is a pricing
 * surface: a heading, a nav link or a button offering one.
 */
const PRICING_OFFER = /<(?:h[1-6]|a|button)\b[^>]*>[^<]{0,40}\b(pricing|plans?\s*(?:&amp;|and)?\s*pricing|buy now|start (?:my |your )?free)\b/i;

/**
 * Denylisted names, held as DIGESTS rather than as literals.
 *
 * This is the repo that goes public, so a guard that listed the names would publish the
 * very thing it exists to keep off the page. Tokenise the page, hash each word, compare
 * digests: the check never has to hold the thing it is checking for.
 *
 * The fourth digest is a canary with no meaning outside this file. It exists so the
 * mechanism can be proven to bite, below, without a real name appearing anywhere.
 */
const RETIRED_DIGESTS = new Map([
  ['4bd5649215d7b317', 'a denylisted name'],
  ['64686f98a42da487', 'a denylisted name'],
  ['ec647b5d5ef393bc', 'a denylisted name'],
  ['64b1c14051e233d6', 'the canary token'],
]);
const sha = (s) => createHash('sha256').update(s, 'utf8').digest('hex').slice(0, 16);
const retiredNamesIn = (src) => {
  const out = [];
  for (const w of src.toLowerCase().match(/[a-z]{4,}/g) ?? []) {
    const label = RETIRED_DIGESTS.get(sha(w));
    if (label) out.push(label);
  }
  return [...new Set(out)];
};

/** Pull `mini`, `t` and `d` out of the DATA literal in use-cases.html. */
function extractCards(html) {
  const start = html.indexOf('const DATA = [');
  if (start === -1) return null;
  const end = html.indexOf('const list=', start);
  if (end === -1) return null;
  const block = html.slice(start, end);
  const cards = [];
  const re = /\{\s*\n\s*t:"((?:[^"\\]|\\.)*)",\s*\n\s*d:"((?:[^"\\]|\\.)*)",[\s\S]*?mini:`([\s\S]*?)`\s*\n\s*\}/g;
  let m;
  while ((m = re.exec(block)) !== null) cards.push({ t: m[1], d: m[2], mini: m[3] });
  return cards;
}

// =========================================================================
section(0, 'The extractor can see the card data');

const ucHtml = read('use-cases.html');
const cards = extractCards(ucHtml);

if (cards === null) {
  fail('could not locate the DATA block in use-cases.html — every check below would pass vacuously');
} else if (cards.length === 0) {
  fail('extracted zero cards — the regex matched nothing, so nothing was checked');
} else {
  pass(`extracted ${cards.length} cards`);

  // A parse that silently drops fields is the same blindness one level down.
  const emptyMini = cards.filter((c) => c.mini.trim().length < 40);
  const emptyCopy = cards.filter((c) => c.t.trim().length < 5 || c.d.trim().length < 20);
  if (emptyMini.length) fail(`${emptyMini.length} card(s) parsed with an empty/short mini — the mock-up scan would see nothing`);
  else pass('every card carries a non-trivial mini mock-up');
  if (emptyCopy.length) fail(`${emptyCopy.length} card(s) parsed with empty title/description`);
  else pass('every card carries title and description text');

  // The landing page prints this count in prose. Generate the comparison from the DATA
  // array rather than trusting the comment beside it that says "re-count and edit here" —
  // the same move the connector provenance block already makes. A figure a human is asked
  // to maintain drifts silently; one checked against its own source cannot.
  //
  // The no-match branch FAILS rather than skipping: if the prose line is reworded, a
  // check that quietly found nothing would report a clean page forever.
  const idxForCount = read('index.html');
  const countMatch = idxForCount.match(/See all +([0-9]+) +use cases/i);
  if (!countMatch) {
    fail('could not find the "See all N use cases" line in index.html — the count check would pass vacuously');
  } else if (Number(countMatch[1]) !== cards.length) {
    fail(`index.html says "See all ${countMatch[1]} use cases" but use-cases.html carries ${cards.length}`);
  } else {
    pass(`the landing page count matches the catalogue exactly (${cards.length})`);
  }
}

// =========================================================================
section(1, 'The detectors bite (known-bad fixture)');

// This is the half that fails if someone "simplifies" a regex into uselessness.
// It never touches the tree, so it stays meaningful even if the tree is empty.
const BAD_MINI = '<div class="row"><div class="cell">Matched</div><div class="cell"><span class="pill g">218</span></div></div>';
const BAD_BAR = '<div class="bar"><i style="width:72%"></i></div>';
const BAD_COPY = 'Cuts the job from 20 min to 10 min, a 48% saving.';

if (digitsIn(BAD_MINI).length === 0) fail('digit detector missed a count in a fixture mock-up');
else pass('digit detector flags an outcome count');

if (digitsIn(BAD_BAR).length === 0) fail('digit detector missed a percentage bar width');
else pass('digit detector flags a progress-bar percentage');

if (ratesIn(BAD_COPY).length < 3) fail(`rate detector found ${ratesIn(BAD_COPY).length} of 3 claims in a fixture line`);
else pass('rate detector flags durations and percentages in copy');

if (!PRICING_OFFER.test('<h2>Pricing</h2>')) fail('pricing detector missed a Pricing heading');
else pass('pricing detector flags a pricing surface');

// And the mirror. Each of these is a false positive an earlier version of this
// file actually produced; a detector that cries wolf gets skipped, so the
// quiet-on-clean half is asserted as hard as the biting half.
const CLEAN = [
  ['an outcome-free mock-up row', () => digitsIn('<div class="cell">Matched</div><span class="pill g">ok</span>').length],
  ['a heading tag whose NAME contains a digit', () => digitsIn('<h4>Reconciliation</h4>').length],
  ['competitor-research prose mentioning pricing', () => (PRICING_OFFER.test('gathers pricing, positioning and product changes') ? 1 : 0)],
];
let noisy = 0;
for (const [what, run] of CLEAN) {
  if (run() !== 0) { noisy++; fail(`detector fired on ${what} — a stuck alarm is worse than none`); }
}
if (!noisy) pass('detectors stay quiet on all clean fixtures');

// The retired-name scan can only be proven with a name it will match, and this
// repo must not hold one. The canary digest is that name: meaningless outside
// this file, but it exercises the whole path — tokenise, hash, look up — so a
// broken tokeniser cannot pass by finding nothing.
if (retiredNamesIn('a page mentioning canaryvendorname in passing').length === 0) {
  fail('retired-name digest scan missed the canary — tokenise/hash path is broken');
} else pass('retired-name digest scan flags the canary token');
if (retiredNamesIn('an ordinary page about agents and workflows').length !== 0) {
  fail('retired-name digest scan fired on clean copy');
} else pass('retired-name digest scan stays quiet on clean copy');

// =========================================================================
section(2, 'No digits in the illustrative mock-ups');

if (cards?.length) {
  let dirty = 0;
  for (const c of cards) {
    const found = digitsIn(c.mini);
    if (found.length) {
      dirty++;
      fail(`"${c.t}" — mock-up contains digit(s): ${found.join('')}`);
    }
  }
  if (!dirty) pass(`all ${cards.length} mock-ups are digit-free`);
}

// =========================================================================
section(3, 'No durations, rates or percentages in card copy');

if (cards?.length) {
  let dirty = 0;
  for (const c of cards) {
    const found = [...ratesIn(c.t), ...ratesIn(c.d)];
    if (found.length) {
      dirty++;
      fail(`"${c.t}" — copy contains claim(s): ${found.join(', ')}`);
    }
  }
  if (!dirty) pass(`all ${cards.length} cards are free of rate and duration claims`);
}

// =========================================================================
section(4, 'No pricing, trial or licensing vocabulary on the site');

// Licensing may or may not still ship; either way this site does not advertise it,
// so the words must not appear. Scoped to rendered pages, not this checker.
const FORBIDDEN = [
  [/\bfree\s+trial\b/i, '"free trial"'],
  [/\b\d+[-\s]day\s+trial\b/i, 'an N-day trial'],
  [/\btrial\b/i, '"trial"'],
  [/\blicen[cs]e\s+key\b/i, '"license key"'],
  [/\bper\s+month\b/i, '"per month"'],
  [/\bsubscription\b/i, '"subscription"'],
  [/\bcredits\b/i, '"credits"'],
  [/\$\s?\d/, 'a dollar figure'],
  [PRICING_OFFER, 'a pricing heading, link or button'],
];


const pages = readdirSync(ROOT).filter((f) => f.endsWith('.html'));
if (pages.length === 0) {
  fail('no .html pages found to scan — this section checked nothing');
} else {
  let hits = 0;
  for (const page of pages) {
    const src = read(page);
    for (const [re, label] of FORBIDDEN) {
      if (re.test(src)) { hits++; fail(`${page} contains ${label}`); }
    }
    for (const label of retiredNamesIn(src)) { hits++; fail(`${page} contains ${label}`); }
  }
  if (!hits) pass(`${pages.length} page(s) clean of ${FORBIDDEN.length} patterns + ${RETIRED_DIGESTS.size} digests`);
}

// =========================================================================
section(5, 'The connector list still carries its provenance');

const idx = read('index.html');
const provMatch = idx.match(/<script type="application\/json" id="connector-data">([\s\S]*?)<\/script>/);
if (!provMatch) {
  fail('connector-data block missing from index.html');
} else {
  let parsed = null;
  try { parsed = JSON.parse(provMatch[1]); } catch (e) { fail(`connector-data is not valid JSON: ${e.message}`); }
  if (parsed) {
    const s = parsed._source ?? {};
    if (!/^[0-9a-f]{40}$/.test(s.commit ?? '')) fail('connector-data._source.commit is not a full commit sha');
    else pass(`connector list sourced from ${s.file} @ ${s.commit.slice(0, 7)}`);
    if (!Array.isArray(parsed.connectors) || parsed.connectors.length === 0) fail('connector list is empty');
    else pass(`${parsed.connectors.length} connectors listed`);
  }
}

// =========================================================================
console.log('');
if (failures.length) {
  console.log(`FAILED — ${failures.length} problem(s):`);
  for (const f of failures) console.log(`  · ${f}`);
  process.exitCode = 1;
} else {
  console.log('All claim checks passed.');
  process.exitCode = 0;
}
