import execa from 'execa';
import fs from 'fs';
import fetch from 'node-fetch';
import { open } from 'sqlite';
import sqlite3 from 'sqlite3';
import { loadConfig } from '../dist/config.js';
import dev from '../dist/dev/index.js';
import build from '../dist/build/index.js';
import preview from '../dist/preview/index.js';
import { fileURLToPath } from 'url';

/**
 * Load Astro fixture
 * @param {Object} inlineConfig Astro config partial (note: must specify projectRoot)
 * @returns {Object} Fixture. Has the following properties:
 *   .config     - Returns the final config. Will be automatically passed to the methods below:
 *
 *   Dev
 *   .dev()          - Async. Starts a dev server (note: you must call `await server.stop()` before test exit)
 *   .fetch()        - Async. Returns a URL from the dev server (must have called .dev() before)
 *
 *   Build
 *   .build()        - Async. Builds into current folder (will erase previous build)
 *   .readFile(path) - Async. Read a file from the build.
 *   .preview()      - Async. Starts a preview server. Note this can’t be running in same fixture as .dev() as they share ports. Also, you must call `server.close()` before test exit
 *   .fetch(url)     - Async. Returns a URL from the prevew server (must have called .preview() before)
 */
export async function loadFixture(inlineConfig) {
  if (!inlineConfig || !inlineConfig.projectRoot) throw new Error("Must provide { projectRoot: './fixtures/...' }");

  // load config
  let cwd = inlineConfig.projectRoot;
  if (typeof cwd === 'string') {
    try {
      cwd = new URL(cwd.replace(/\/?$/, '/'));
    } catch (err1) {
      cwd = new URL(cwd.replace(/\/?$/, '/'), import.meta.url);
    }
  }

  // merge configs
  if (!inlineConfig.buildOptions) inlineConfig.buildOptions = {};
  if (inlineConfig.buildOptions.sitemap === undefined) inlineConfig.buildOptions.sitemap = false;
  if (!inlineConfig.devOptions) inlineConfig.devOptions = {};
  inlineConfig.devOptions.port = await uniquePort(); // force each test to have its own port
  if (!inlineConfig.devOptions.hostname) inlineConfig.devOptions.hostname = 'localhost';
  if (!inlineConfig.dist) inlineConfig.dist = './dist/';
  if (!inlineConfig.pages) inlineConfig.pages = './src/pages/';
  if (!inlineConfig.public) inlineConfig.public = './public/';
  if (!inlineConfig.src) inlineConfig.src = './src/';
  let config = await loadConfig(cwd);
  config = merge(config, {
    ...inlineConfig,
    projectRoot: cwd,
    dist: new URL(inlineConfig.dist, cwd),
    pages: new URL(inlineConfig.pages, cwd),
    public: new URL(inlineConfig.public, cwd),
    src: new URL(inlineConfig.src, cwd),
  });

  return {
    build: (opts = {}) => build(config, { logging: 'error', ...opts }),
    dev: (opts = {}) => dev(config, { logging: 'error', ...opts }),
    config,
    fetch: (url) => fetch(`http://${config.devOptions.hostname}:${config.devOptions.port}${url}`),
    readFile: (filePath) => fs.promises.readFile(new URL(`${filePath.replace(/^\/?/, '')}`, config.dist), 'utf8'),
    preview: (opts = {}) => preview(config, { logging: 'error', ...opts }),
  };
}

/**
 * Basic object merge utility. Returns new copy of merged Object.
 * @param {Object} a
 * @param {Object} b
 * @returns {Object}
 */
function merge(a, b) {
  const allKeys = new Set([...Object.keys(a), ...Object.keys(b)]);
  const c = {};
  for (const k of allKeys) {
    const needsObjectMerge =
      typeof a[k] === 'object' && typeof b[k] === 'object' && Object.keys(a[k]).length && Object.keys(b[k]).length && !Array.isArray(a[k]) && !Array.isArray(b[k]);
    if (needsObjectMerge) {
      c[k] = merge(a[k] || {}, b[k] || {});
      continue;
    }
    c[k] = a[k];
    if (b[k] !== undefined) c[k] = b[k];
  }
  return c;
}

const cliURL = new URL('../astro.js', import.meta.url);

/** Start Dev server via CLI */
export function devCLI(root, additionalArgs = []) {
  const args = [cliURL.pathname, 'dev', '--project-root', root.pathname].concat(additionalArgs);
  const proc = execa('node', args);
  return proc;
}

let db;
const DB_PATH = new URL('./test-state.sqlite', import.meta.url);

/**
 * Get a unique port. Uses sqlite to share state across multiple threads.
 * Also has better success than get-port due to race conditions and inability to work with multiple processes.
 */
export async function uniquePort() {
  if (!db) db = await open({ filename: fileURLToPath(DB_PATH), driver: sqlite3.Database });
  let lastPort = 2999; // first run: start at 3001
  const row = await db.get(`SELECT port FROM test_ports ORDER BY ID DESC LIMIT 1`);
  if (row) {
    lastPort = parseInt(row.port, 10);
  }
  lastPort += 1; // bump by one
  await db.run(`INSERT INTO test_ports (port) VALUES (${lastPort});`);
  return lastPort;
}
