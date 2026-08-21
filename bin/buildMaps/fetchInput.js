const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const REPO = 'reuters-graphics/country-borders';
const INPUT_DIR = path.resolve(__dirname, '../../input');
const SHA_FILE = path.join(INPUT_DIR, '.country-borders-sha');
const FILES = [
  'country-polygon-low-detail.geojson',
  'country-polygon-medium-detail.geojson',
  'country-polygon-high-detail.geojson',
  'country-lines-low-detail.geojson',
  'country-lines-medium-detail.geojson',
  'country-lines-high-detail.geojson',
];

// Download the country-borders GeoJSON build inputs via the GitHub CLI (the
// repo is private, so `gh` must be authenticated).
//
// Reproducible by default: the source commit is pinned in
// input/.country-borders-sha (committed) and every file is fetched at that ref.
// Pass { force: true } to re-pin to the latest country-borders `main`.
module.exports = ({ force = false } = {}) => {
  fs.mkdirSync(INPUT_DIR, { recursive: true });

  const haveAll = FILES.every(f => fs.existsSync(path.join(INPUT_DIR, f)));
  if (haveAll && !force) {
    console.log('Input already present — skipping download (pass { force: true } to refresh).');
    return;
  }

  // Prefer the committed pin for reproducible builds; only resolve (and re-pin
  // to) `main` when explicitly refreshing or when no pin exists yet.
  const havePin = fs.existsSync(SHA_FILE);
  let sha;
  if (havePin && !force) {
    sha = fs.readFileSync(SHA_FILE, 'utf-8').trim();
    console.log(`Using pinned country-borders commit: ${sha}`);
  } else {
    sha = execSync(`gh api repos/${REPO}/commits/main --jq .sha`).toString().trim();
    fs.writeFileSync(SHA_FILE, `${sha}\n`);
    console.log(`${havePin ? 'Re-pinned' : 'Pinned'} country-borders to main @ ${sha}`);
  }

  console.log(`Fetching country-borders GeoJSON via gh (${REPO}@${sha})`);
  for (const f of FILES) {
    const dest = path.join(INPUT_DIR, f);
    execSync(
      `gh api "repos/${REPO}/contents/output/geojson/${f}?ref=${sha}" -H "Accept: application/vnd.github.raw" > "${dest}"`,
      { shell: '/bin/bash' }
    );
    console.log(`  ${f}`);
  }
};
