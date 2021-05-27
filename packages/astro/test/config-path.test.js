import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import { runDevServer } from './helpers.js';

const ConfigPath = suite('Config path');
const MAX_TEST_TIME = 10000; // max time this test suite may take

const root = new URL('./fixtures/config-path/', import.meta.url);
const timers = {};

ConfigPath.before.each(({ __test__ }) => {
  timers[__test__] = setTimeout(() => {
    throw new Error(`Test "${__test__}" did not finish within allowed time`);
  }, MAX_TEST_TIME);
});

ConfigPath('can be passed via --config', async (context) => {
  const configPath = new URL('./config/my-config.mjs', root).pathname;
  const args = ['--config', configPath];
  const process = runDevServer(root, args);

  process.stdout.setEncoding('utf8');
  for await (const chunk of process.stdout) {
    if (/Server started/.test(chunk)) {
      break;
    }
  }

  process.kill();
  assert.ok(true, 'Server started');
});

ConfigPath.after.each(({ __test__ }) => {
  clearTimeout(timers[__test__]);
});

ConfigPath.run();
