import { expect } from 'chai';
import os from 'os';
import { loadFixture } from './test-utils.js';

// TODO: fix these tests on macOS
const isMacOS = os.platform() === 'darwin';

let fixture;
let devServer;

before(async () => {
  fixture = await loadFixture({
    projectRoot: './fixtures/errors',
    renderers: ['@astrojs/renderer-preact', '@astrojs/renderer-react', '@astrojs/renderer-solid', '@astrojs/renderer-svelte', '@astrojs/renderer-vue'],
    vite: {
      optimizeDeps: false, // necessary to prevent Vite throwing on bad files
    },
  });
  devServer = await fixture.startDevServer();
});

describe('Error display', () => {
  describe('Astro', () => {
    // This test is redundant w/ runtime error since it no longer produces an Astro syntax error
    it.skip('syntax error', async () => {
      if (isMacOS) return;

      const res = await fixture.fetch('/astro-syntax-error');

      // 500 returned
      expect(res.status).to.equal(500);

      // error message includes "unrecoverable error"
      const body = await res.text();
      console.log(res.body);
      expect(body).to.include('unrecoverable error');
    });

    it('runtime error', async () => {
      if (isMacOS) return;

      const res = await fixture.fetch('/astro-runtime-error');

      // 500 returned
      expect(res.status).to.equal(500);

      // error message contains error
      const body = await res.text();
      expect(body).to.include('ReferenceError: title is not defined');

      // TODO: improve stacktrace
    });
  });

  describe('JS', () => {
    it('syntax error', async () => {
      if (isMacOS) return;

      const res = await fixture.fetch('/js-syntax-error');

      // 500 returnd
      expect(res.status).to.equal(500);

      // error message is helpful
      const body = await res.text();
      expect(body).to.include('Parse failure');
    });

    it('runtime error', async () => {
      if (isMacOS) return;

      const res = await fixture.fetch('/js-runtime-error');

      // 500 returnd
      expect(res.status).to.equal(500);

      // error message is helpful
      const body = await res.text();
      expect(body).to.include('ReferenceError: undefinedvar is not defined');
    });
  });

  describe('Preact', () => {
    it('syntax error', async () => {
      if (isMacOS) return;

      const res = await fixture.fetch('/preact-syntax-error');

      // 500 returned
      expect(res.status).to.equal(500);

      // error message is helpful
      const body = await res.text();
      expect(body).to.include('Syntax error');
    });

    it('runtime error', async () => {
      if (isMacOS) return;

      const res = await fixture.fetch('/preact-runtime-error');

      // 500 returned
      expect(res.status).to.equal(500);

      // error message is helpful
      const body = await res.text();
      expect(body).to.include('Error: PreactRuntimeError');
    });
  });

  describe('React', () => {
    it('syntax error', async () => {
      if (isMacOS) return;

      const res = await fixture.fetch('/react-syntax-error');

      // 500 returned
      expect(res.status).to.equal(500);

      // error message is helpful
      const body = await res.text();
      expect(body).to.include('Syntax error');
    });

    it('runtime error', async () => {
      if (isMacOS) return;

      const res = await fixture.fetch('/react-runtime-error');

      // 500 returned
      expect(res.status).to.equal(500);

      // error message is helpful
      const body = await res.text();
      expect(body).to.include('Error: ReactRuntimeError');
    });
  });

  describe('Solid', () => {
    it('syntax error', async () => {
      if (isMacOS) return;

      const res = await fixture.fetch('/solid-syntax-error');

      // 500 returned
      expect(res.status).to.equal(500);

      // error message is helpful
      const body = await res.text();
      expect(body).to.include('Syntax error');
    });

    it('runtime error', async () => {
      if (isMacOS) return;

      const res = await fixture.fetch('/solid-runtime-error');

      // 500 returned
      expect(res.status).to.equal(500);

      // error message is helpful
      const body = await res.text();
      expect(body).to.include('Error: SolidRuntimeError');
    });
  });

  describe('Svelte', () => {
    it('syntax error', async () => {
      if (isMacOS) return;

      const res = await fixture.fetch('/svelte-syntax-error');

      // 500 returned
      expect(res.status).to.equal(500);

      // error message is helpful
      const body = await res.text();
      expect(body).to.include('ParseError');
    });

    it('runtime error', async () => {
      if (isMacOS) return;

      const res = await fixture.fetch('/svelte-runtime-error');

      // 500 returned
      expect(res.status).to.equal(500);

      // error message is helpful
      const body = await res.text();
      expect(body).to.include('Error: SvelteRuntimeError');
    });
  });

  describe('Vue', () => {
    it('syntax error', async () => {
      if (isMacOS) return;

      const res = await fixture.fetch('/vue-syntax-error');

      const body = await res.text();

      // 500 returned
      expect(res.status).to.equal(500);

      // error message is helpful
      expect(body).to.include('Parse failure');
    });

    it('runtime error', async () => {
      if (isMacOS) return;

      const res = await fixture.fetch('/vue-runtime-error');

      // 500 returned
      expect(res.status).to.equal(500);

      // error message is helpful
      const body = await res.text();
      expect(body).to.match(/Cannot read.*undefined/); // note: error differs slightly between Node versions
    });
  });
});

after(async () => {
  await devServer.stop();
});
