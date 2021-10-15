import execa from 'execa';
import fetch from 'node-fetch';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { loadConfig } from '../dist/core/config.js';
import build from '../dist/core/build/index.js';
import preview from '../dist/core/preview/index.js';

/**
 * Load Astro fixture
 * @param {Object} inlineConfig Astro config partial (note: must specify projectRoot)
 * @returns {Object} Fixture. Has the following properties:
 *   .config     - Returns the final config. Will be automatically passed to the methods below:
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
  let config = await loadConfig({ cwd: fileURLToPath(cwd) });
  config = merge(config, { ...inlineConfig, projectRoot: cwd });

  return {
    build: (opts = {}) => build(config, { mode: 'development', logging: 'error', ...opts }),
    config,
    fetch: (url, init) => fetch(`http://${config.devOptions.hostname}:${config.devOptions.port}${url.replace(/^\/?/, '/')}`, init),
    preview: async (opts = {}) => {
      const previewServer = await preview(config, { logging: 'error', ...opts });
      inlineConfig.devOptions.port = previewServer.port; // update port for fetch
      return previewServer;
    },
    readFile: (filePath) => fs.promises.readFile(new URL(filePath.replace(/^\//, ''), config.dist), 'utf8'),
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
      typeof a[k] === 'object' && typeof b[k] === 'object' && (Object.keys(a[k]).length || Object.keys(b[k]).length) && !Array.isArray(a[k]) && !Array.isArray(b[k]);
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
