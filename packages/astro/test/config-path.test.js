import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import { runDevServer } from './helpers.js';

const ConfigPath = suite('Config path');

const root = new URL('./fixtures/config-path/', import.meta.url);
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

ConfigPath.run();
