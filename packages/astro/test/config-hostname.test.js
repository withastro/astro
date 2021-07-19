import { fileURLToPath } from 'url';
import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import { runDevServer } from './helpers.js';
import { loadConfig } from '#astro/config';

const ConfigPort = suite('Config hostname');
const MAX_TEST_TIME = 10000; // max time this test suite may take

const root = new URL('./fixtures/config-hostname/', import.meta.url);
const timers = {};

ConfigPort.before.each(({ __test__ }) => {
  timers[__test__] = setTimeout(() => {
    throw new Error(`Test "${__test__}" did not finish within allowed time`);
  }, MAX_TEST_TIME);
});

ConfigPort('can be specified in the astro config', async (context) => {
  const astroConfig = await loadConfig(fileURLToPath(root));
  assert.equal(astroConfig.devOptions.hostname, '0.0.0.0');
});

ConfigPort('can be specified via --hostname flag', async (context) => {
  const args = ['--hostname', '127.0.0.1'];
  const proc = runDevServer(root, args);

  proc.stdout.setEncoding('utf8');
  for await (const chunk of proc.stdout) {
    if (/Local:/.test(chunk)) {
      assert.ok(/:127.0.0.1/.test(chunk), 'Using the right hostname');
      break;
    }
  }

  proc.kill();
});

ConfigPort.after.each(({ __test__ }) => {
  clearTimeout(timers[__test__]);
});

ConfigPort.run();
