import { fileURLToPath } from 'url';
import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import { runDevServer } from './helpers.js';
import { loadConfig } from '#astro/config';

const ConfigPort = suite('Config path');
const MAX_TEST_TIME = 10000; // max time this test suite may take

const root = new URL('./fixtures/config-port/', import.meta.url);
const timers = {};

ConfigPort.before.each(({ __test__ }) => {
  timers[__test__] = setTimeout(() => {
    throw new Error(`Test "${__test__}" did not finish within allowed time`);
  }, MAX_TEST_TIME);
});

ConfigPort('can be specified in the astro config', async (context) => {
  const astroConfig = await loadConfig(fileURLToPath(root));
  assert.equal(astroConfig.devOptions.port, 3001);
});

ConfigPort('can be specified via --port flag', async (context) => {
  const args = ['--port', '3002'];
  const proc = runDevServer(root, args);

  proc.stdout.setEncoding('utf8');
  for await (const chunk of proc.stdout) {
    if (/Local:/.test(chunk)) {
      assert.ok(/:3002/.test(chunk), 'Using the right port');
      break;
    }
  }

  proc.kill();
});

ConfigPort.after.each(({ __test__ }) => {
  clearTimeout(timers[__test__]);
});

ConfigPort.run();
