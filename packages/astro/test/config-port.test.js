import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import { runDevServer } from './helpers.js';
import { loadConfig } from '#astro/config';

const ConfigPort = suite('Config path');

const root = new URL('./fixtures/config-port/', import.meta.url);
ConfigPort('can be specified in the astro config', async (context) => {
  const astroConfig = await loadConfig(root.pathname);
  assert.equal(astroConfig.devOptions.port, 3001);
});

ConfigPort('can be specified via --port flag', async (context) => {
  const args = ['--port', '3002'];
  const process = runDevServer(root, args);

  process.stdout.setEncoding('utf8');
  for await (const chunk of process.stdout) {
    if (/Local:/.test(chunk)) {
      assert.ok(/:3002/.test(chunk), 'Using the right port');
      break;
    }
  }

  process.kill();
});

ConfigPort.run();
