import { devCLI, loadFixture } from './test-utils.js';

let hostnameFixture;
let portFixture;

beforeAll(async () => {
  [hostnameFixture, portFixture] = await Promise.all([loadFixture({ projectRoot: './fixtures/config-hostname/' }), loadFixture({ projectRoot: './fixtures/config-port/' })]);
});

describe('config', () => {
  describe('hostname', () => {
    test('can be specified in astro.config.mjs', async () => {
      expect(hostnameFixture.config.devOptions.hostname).toBe('0.0.0.0');
    });

    test('can be specified via --hostname flag', async () => {
      const cwd = './fixtures/config-hostname/';
      const cwdURL = new URL(cwd, import.meta.url);
      const args = ['--hostname', '127.0.0.1'];
      const proc = devCLI(cwdURL, args);

      proc.stdout.setEncoding('utf8');
      for await (const chunk of proc.stdout) {
        if (/Local:/.test(chunk)) {
          expect(chunk).toEqual(expect.stringContaining('127.0.0.1'));
          break;
        }
      }
    });
  });

  describe('path', () => {
    test('can be passed via --config', async () => {
      const cwd = './fixtures/config-path/';
      const cwdURL = new URL(cwd, import.meta.url);
      const configPath = new URL('./config/my-config.mjs', cwdURL).pathname;
      const args = ['--config', configPath];
      const process = devCLI(cwdURL, args);

      process.stdout.setEncoding('utf8');
      for await (const chunk of process.stdout) {
        if (/Server started/.test(chunk)) {
          break;
        }
      }
    });
  });

  describe('port', () => {
    test('can be specified in astro.config.mjs', async () => {
      expect(portFixture.config.devOptions.port).toEqual(5006);
    });
  });
});
