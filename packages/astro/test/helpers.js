import { fileURLToPath } from 'url';
import { build as astroBuild } from '#astro/build';
import { readFile } from 'fs/promises';
import { createRuntime } from '#astro/runtime';
import { loadConfig } from '#astro/config';
import * as assert from 'uvu/assert';
import execa from 'execa';

/** setup fixtures for tests */
export function setup(Suite, fixturePath) {
  let runtime, setupError;

  Suite.before(async (context) => {
    const astroConfig = await loadConfig(fileURLToPath(new URL(fixturePath, import.meta.url)));

    const logging = {
      level: 'error',
      dest: process.stderr,
    };

    try {
      runtime = await createRuntime(astroConfig, { logging });
    } catch (err) {
      console.error(err);
      setupError = err;
    }

    context.runtime = runtime;
  });

  Suite.after(async () => {
    (await runtime) && runtime.shutdown();
  });

  Suite('No errors creating a runtime', () => {
    assert.equal(setupError, undefined);
  });
}

export function setupBuild(Suite, fixturePath) {
  let build, setupError;

  Suite.before(async (context) => {
    const astroConfig = await loadConfig(fileURLToPath(new URL(fixturePath, import.meta.url)));

    const logging = {
      level: 'error',
      dest: process.stderr,
    };

    build = (...args) => astroBuild(astroConfig, ...args);
    context.build = build;
    context.readFile = async (path) => {
      const resolved = fileURLToPath(new URL(`${fixturePath}/${astroConfig.dist}${path}`, import.meta.url));
      return readFile(resolved).then((r) => r.toString('utf8'));
    };
  });

  Suite.after(async () => {
    // Shutdown i guess.
  });

  Suite('No errors creating a runtime', () => {
    assert.equal(setupError, undefined);
  });
}

const cliURL = new URL('../astro.mjs', import.meta.url);
export function runDevServer(root, additionalArgs = []) {
  const args = [cliURL.pathname, 'dev', '--project-root', root.pathname].concat(additionalArgs);
  const proc = execa('node', args);
  return proc;
}
