import { expect } from 'chai';
import { cli, loadFixture } from './test-utils.js';
import { fileURLToPath } from 'url';

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
      const projectRootURL = new URL('./fixtures/astro-basic/', import.meta.url);
      const proc = cli('dev', '--project-root', fileURLToPath(projectRootURL), '--hostname', '127.0.0.1');

      let stdout = '';

      for await (const chunk of proc.stdout) {
        stdout += chunk;

        if (chunk.includes('Local:')) break;
      }

      proc.kill();

      expect(stdout).to.include('127.0.0.1');
    });
  });

  describe('path', () => {
    it('can be passed via --config', async () => {
      const projectRootURL = new URL('./fixtures/astro-basic/', import.meta.url);
      const configFileURL = new URL('./fixtures/config-path/config/my-config.mjs', import.meta.url);
      const proc = cli('dev', '--project-root', fileURLToPath(projectRootURL), '--config', configFileURL.pathname);

      let stdout = '';

      for await (const chunk of proc.stdout) {
        stdout += chunk;

        if (chunk.includes('Local:')) break;
      }

      proc.kill();

      expect(stdout).to.include('127.0.0.1');
    });
  });

  describe('port', () => {
    it('can be specified in astro.config.mjs', async () => {
      expect(portFixture.config.devOptions.port).to.deep.equal(5006);
    });
  });
});
