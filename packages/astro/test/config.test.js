import { expect } from 'chai';
import { devCLI, loadFixture } from './test-utils.js';

describe('config', () => {
  let hostnameFixture;
  let portFixture;

  before(async () => {
    [hostnameFixture, portFixture] = await Promise.all([loadFixture({ projectRoot: './fixtures/config-hostname/' }), loadFixture({ projectRoot: './fixtures/config-port/' })]);
  });

  describe('hostname', () => {
    it('can be specified in astro.config.mjs', async () => {
      expect(hostnameFixture.config.devOptions.hostname).to.equal('0.0.0.0');
    });

    it('can be specified via --hostname flag', async () => {
      const cwd = './fixtures/config-hostname/';
      const cwdURL = new URL(cwd, import.meta.url);
      const args = ['--hostname', '127.0.0.1'];
      const proc = devCLI(cwdURL, args);

      proc.stdout.setEncoding('utf8');

      for await (const chunk of proc.stdout) {
        if (/Local:/.test(chunk)) {
          expect(chunk).to.include('127.0.0.1');
          break;
        }
      }

      proc.kill();
    });
  });

  describe('path', () => {
    it('can be passed via --config', async () => {
      const cwd = './fixtures/config-path/';
      const cwdURL = new URL(cwd, import.meta.url);
      const configPath = new URL('./config/my-config.mjs', cwdURL).pathname;
      const args = ['--config', configPath];
      const proc = devCLI(cwdURL, args);

      proc.stdout.setEncoding('utf8');

      for await (const chunk of proc.stdout) {
        if (/Server started/.test(chunk)) {
          break;
        }
      }

      proc.kill();
    });
  });

  describe('port', () => {
    it('can be specified in astro.config.mjs', async () => {
      expect(portFixture.config.devOptions.port).to.deep.equal(5006);
    });
  });
});
