import { loadConfig } from '../dist/config';
import { devCLI, loadFixture } from './test-utils.js';

describe('config', () => {
  describe('hostname', () => {
    const cwd = './fixtures/config-hostname/';
    const cwdURL = new URL(cwd, import.meta.url);

    test('can be specified in astro.config.mjs', async () => {
      const fixture = await loadFixture({
        projectRoot: cwd,
        devOptions: { hostname: '0.0.0.0' },
      });
      expect(fixture.config.devOptions.hostname).toBe('0.0.0.0');
    });

    test('can be specified via --hostname flag', async () => {
      const args = ['--hostname', '127.0.0.1'];
      const proc = devCLI(cwdURL, args);

      proc.stdout.setEncoding('utf8');
      for await (const chunk of proc.stdout) {
        if (/Local:/.test(chunk)) {
          expect(chunk).toEqual(expect.stringContaining('127.0.0.1'));
          break;
        }
      }

      proc.kill();
    });
  });

  describe('path', () => {
    const cwd = './fixtures/config-path/';
    const cwdURL = new URL(cwd, import.meta.url);

    test('can be passed via --config', async () => {
      const configPath = new URL('./config/my-config.mjs', cwdURL).pathname;
      const args = ['--config', configPath];
      const process = devCLI(cwdURL, args);

      process.stdout.setEncoding('utf8');
      for await (const chunk of process.stdout) {
        if (/Server started/.test(chunk)) {
          break;
        }
      }

      process.kill();
      // test will time out if the server never started
    });
  });

  describe('port', () => {
    const cwd = './fixtures/config-port/';
    const cwdURL = new URL(cwd, import.meta.url);

    test.skip('can be specified in astro.config.mjs', async () => {
      const config = await loadConfig(cwdURL);
      expect(config.devOptions.port).toEqual(5001);
    });

    test.skip('can be specified via --port flag', async () => {
      const args = ['--port', '5002']; // note: this should be on the higher-end of possible ports
      const proc = devCLI(cwdURL, args);

      proc.stdout.setEncoding('utf8');
      for await (const chunk of proc.stdout) {
        if (/Local:/.test(chunk)) {
          expect(chunk).toEqual(expect.stringContaining(':5002'));
          break;
        }
      }

      proc.kill();
      // test will time out on a different port
    });
  });
});
