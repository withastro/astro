import { fileURLToPath } from 'url';
import { build as astroBuild } from '#astro/build';
import { readFile } from 'fs/promises';
import { createRuntime } from '#astro/runtime';
import { loadConfig } from '#astro/config';
import execa from 'execa';
import del from 'del';

const MAX_STARTUP_TIME = 20000; // max time startup may take
const MAX_TEST_TIME = 10000; // max time an individual test may take
const MAX_SHUTDOWN_TIME = 3000; // max time shutdown() may take

/** setup fixtures for tests */

/**
 * @typedef {Object} SetupOptions
 * @prop {import('../src/runtime').RuntimeOptions} runtimeOptions
 */

/**
 * @param {{}} Suite
 * @param {string} fixturePath
 * @param {SetupOptions} setupOptions
 */
export function setup(Suite, fixturePath, { runtimeOptions = {} } = {}) {
  let runtime, createRuntimeError;
  const timers = {};

  Suite.before(async (context) => {
    let timeout = setTimeout(() => {
      throw new Error('Startup did not complete within allowed time');
    }, MAX_STARTUP_TIME);

    const astroConfig = await loadConfig(fileURLToPath(new URL(fixturePath, import.meta.url)));

    runtime = await createRuntime(astroConfig, {
      logging: { level: 'error', dest: process.stderr },
      ...runtimeOptions,
    }).catch(err => { createRuntimeError = err; });

    if(createRuntimeError) {
      setTimeout(() => { throw createRuntimeError });
    }

    context.runtime = runtime;

    clearTimeout(timeout);
  });

  Suite.before.each(({ __test__ }) => {
    if (timers[__test__]) throw new Error(`Test "${__test__}" already declared`);
    timers[__test__] = setTimeout(() => {
      throw new Error(`"${__test__}" did not finish within allowed time`);
    }, MAX_TEST_TIME);
  });

  Suite.after(async () => {
    let timeout = setTimeout(() => {
      throw new Error('Shutdown did not complete within allowed time');
    }, MAX_SHUTDOWN_TIME);

    (await runtime) && runtime.shutdown();

    clearTimeout(timeout);
  });

  Suite.after.each(({ __test__ }) => {
    clearTimeout(timers[__test__]);
  });
}

export function setupBuild(Suite, fixturePath) {
  const timers = {};

  Suite.before(async (context) => {
    let timeout = setTimeout(() => {
      throw new Error('Startup did not complete within allowed time');
    }, MAX_STARTUP_TIME);

    const astroConfig = await loadConfig(fileURLToPath(new URL(fixturePath, import.meta.url)));

    context.build = () => astroBuild(astroConfig, { level: 'error', dest: process.stderr });
    context.readFile = async (path) => {
      const resolved = fileURLToPath(new URL(`${fixturePath}/${astroConfig.dist}${path}`, import.meta.url));
      return readFile(resolved).then((r) => r.toString('utf8'));
    };

    clearTimeout(timeout);
  });

  Suite.before.each(({ __test__ }) => {
    if (timers[__test__]) throw new Error(`Test "${__test__}" already declared`);
    timers[__test__] = setTimeout(() => {
      throw new Error(`"${__test__}" did not finish within allowed time`);
    }, MAX_TEST_TIME);
  });

  Suite.after(async () => {
    // Shutdown i guess.
  });

  Suite.after.each(({ __test__ }) => {
    clearTimeout(timers[__test__]);
  });
}

const cliURL = new URL('../astro.mjs', import.meta.url);
export function runDevServer(root, additionalArgs = []) {
  const args = [cliURL.pathname, 'dev', '--project-root', root.pathname].concat(additionalArgs);
  const proc = execa('node', args);
  return proc;
}

export async function clearCache() {
  const cacheDir = new URL('../../../node_modules/.cache', import.meta.url);
  await del(fileURLToPath(cacheDir));
}
