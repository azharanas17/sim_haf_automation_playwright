#!/usr/bin/env node
/**
 * Consolidate per-batch Playwright blob reports into one HTML report.
 *
 * The Blob reporter writes a `report.zip` per batch into a unique outputDir
 * (BLOB_DIR). `playwright merge-reports` requires the zips to be flat in a
 * single directory, so this script:
 *   1. finds every `<blobRoot>/<runId>/<batch>/report.zip`;
 *   2. copies them to a flat staging dir as `<batch>.zip`;
 *   3. runs `playwright merge-reports` into a run-specific HTML folder.
 *
 * Usage:
 *   node scripts/merge-reports.mjs [--run-id RUN] [--blob-root DIR] [--out DIR]
 *
 * Defaults: run-id = $RUN_ID, blob-root = blob-report,
 *           out = reports/html/<runId>.
 */
import { execFileSync } from 'node:child_process';
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readdirSync,
  rmSync,
  statSync,
} from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..');
const playwrightBin = path.join(
  repoRoot,
  'node_modules',
  '.bin',
  process.platform === 'win32' ? 'playwright.cmd' : 'playwright'
);

const parseArgs = (argv) => {
  const args = {};
  for (let i = 0; i < argv.length; i += 1) {
    if (argv[i] === '--run-id') args.runId = argv[++i];
    else if (argv[i] === '--blob-root') args.blobRoot = argv[++i];
    else if (argv[i] === '--out') args.out = argv[++i];
  }
  return args;
};

const defaultRunId = () => {
  const now = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return (
    `${now.getUTCFullYear()}${pad(now.getUTCMonth() + 1)}${pad(now.getUTCDate())}` +
    `-${pad(now.getUTCHours())}${pad(now.getUTCMinutes())}${pad(now.getUTCSeconds())}`
  );
};

const findZips = (dir, acc = []) => {
  if (!existsSync(dir)) return acc;
  for (const entry of readdirSync(dir)) {
    const full = path.join(dir, entry);
    const st = statSync(full);
    if (st.isDirectory()) findZips(full, acc);
    else if (entry.toLowerCase().endsWith('.zip')) acc.push(full);
  }
  return acc;
};

const main = () => {
  const args = parseArgs(process.argv.slice(2));
  const runId = args.runId || process.env.RUN_ID || defaultRunId();
  const blobRoot = path.resolve(repoRoot, args.blobRoot || 'blob-report');
  const outDir = path.resolve(
    repoRoot,
    args.out || path.join('reports', 'html', runId)
  );
  const searchDir = path.join(blobRoot, runId);
  const scanDir = existsSync(searchDir) ? searchDir : blobRoot;

  const zips = findZips(scanDir);
  if (!zips.length) {
    console.error(
      `No blob report zips found. Looked in: ${scanDir}\n` +
        'Run at least one batch with BLOB_DIR set before merging.'
    );
    process.exit(2);
  }

  const flatDir = path.join(blobRoot, runId, '_flat');
  rmSync(flatDir, { recursive: true, force: true });
  mkdirSync(flatDir, { recursive: true });

  const used = new Set();
  for (const zip of zips) {
    let name = path.basename(path.dirname(zip));
    if (!name || name === path.basename(scanDir)) name = path.basename(zip, '.zip');
    let candidate = `${name}.zip`;
    let i = 1;
    while (used.has(candidate)) candidate = `${name}-${i++}.zip`;
    used.add(candidate);
    copyFileSync(zip, path.join(flatDir, candidate));
  }

  mkdirSync(outDir, { recursive: true });
  console.log(`Merging ${zips.length} blob report(s) into ${outDir}`);
  execFileSync(
    playwrightBin,
    [
      'merge-reports',
      '-c',
      path.join('scripts', 'merge-reports.config.cjs'),
      flatDir,
    ],
    {
      cwd: repoRoot,
      stdio: 'inherit',
      env: { ...process.env, HTML_REPORT_DIR: outDir },
    }
  );

  console.log(`HTML report: ${path.join(outDir, 'index.html')}`);
};

main();
