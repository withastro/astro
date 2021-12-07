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
    it('syntax error in template', async () => {
      // if (isMacOS) return;
      const res = await fixture.fetch('/astro-syntax-error');
      expect(res.status).to.equal(500);
      const body = await res.text();
      console.log(res.body);
      expect(body).to.include('Unexpected &quot;}&quot;');
    });

    it('syntax error in frontmatter', async () => {
      // if (isMacOS) return;
      const res = await fixture.fetch('/astro-frontmatter-syntax-error');
      expect(res.status).to.equal(500);
      const body = await res.text();
      console.log(res.body);
      expect(body).to.include('Unexpected end of frontmatter');
    });

    it('runtime error', async () => {
      // if (isMacOS) return;
      const res = await fixture.fetch('/astro-runtime-error');
      expect(res.status).to.equal(500);
      const body = await res.text();
      expect(body).to.include('ReferenceError: title is not defined');
      // TODO: improve and test stacktrace
    });

    it('hydration error', async () => {
      // if (isMacOS) return;
      const res = await fixture.fetch('/astro-hydration-error');
      expect(res.status).to.equal(500);
      const body = await res.text();
      expect(body).to.include('Error: invalid hydration directive');
    });

    it('client:media error', async () => {
      // if (isMacOS) return;
      const res = await fixture.fetch('/astro-client-media-error');
      expect(res.status).to.equal(500);
      const body = await res.text();
      expect(body).to.include('Error: Media query must be provided');
    });
  });

  describe('JS', () => {
    it('syntax error', async () => {
      // if (isMacOS) return;
      const res = await fixture.fetch('/js-syntax-error');
      expect(res.status).to.equal(500);
      const body = await res.text();
      expect(body).to.include('Parse failure');
    });

    it('runtime error', async () => {
      // if (isMacOS) return;
      const res = await fixture.fetch('/js-runtime-error');
      expect(res.status).to.equal(500);
      const body = await res.text();
      expect(body).to.include('ReferenceError: undefinedvar is not defined');
    });
  });

  describe('Preact', () => {
    it('syntax error', async () => {
      // if (isMacOS) return;
      const res = await fixture.fetch('/preact-syntax-error');
      expect(res.status).to.equal(500);
      const body = await res.text();
      expect(body).to.include('Syntax error');
    });

    it('runtime error', async () => {
      // if (isMacOS) return;
      const res = await fixture.fetch('/preact-runtime-error');
      expect(res.status).to.equal(500);
      const body = await res.text();
      expect(body).to.include('Error: PreactRuntimeError');
    });
  });

  describe('React', () => {
    it('syntax error', async () => {
      // if (isMacOS) return;
      const res = await fixture.fetch('/react-syntax-error');
      expect(res.status).to.equal(500);
      const body = await res.text();
      expect(body).to.include('Syntax error');
    });

    it('runtime error', async () => {
      // if (isMacOS) return;
      const res = await fixture.fetch('/react-runtime-error');
      expect(res.status).to.equal(500);
      const body = await res.text();
      expect(body).to.include('Error: ReactRuntimeError');
    });
  });

  describe('Solid', () => {
    it('syntax error', async () => {
      // if (isMacOS) return;
      const res = await fixture.fetch('/solid-syntax-error');
      expect(res.status).to.equal(500);
      const body = await res.text();
      expect(body).to.include('Syntax error');
    });

    it('runtime error', async () => {
      // if (isMacOS) return;
      const res = await fixture.fetch('/solid-runtime-error');
      expect(res.status).to.equal(500);
      const body = await res.text();
      expect(body).to.include('Error: SolidRuntimeError');
    });
  });

  describe('Svelte', () => {
    it('syntax error', async () => {
      // if (isMacOS) return;
      const res = await fixture.fetch('/svelte-syntax-error');
      expect(res.status).to.equal(500);
      const body = await res.text();
      expect(body).to.include('ParseError');
    });

    it('runtime error', async () => {
      // if (isMacOS) return;
      const res = await fixture.fetch('/svelte-runtime-error');
      expect(res.status).to.equal(500);
      const body = await res.text();
      expect(body).to.include('Error: SvelteRuntimeError');
    });
  });

  describe('Vue', () => {
    it('syntax error', async () => {
      // if (isMacOS) return;
      const res = await fixture.fetch('/vue-syntax-error');
      const body = await res.text();
      expect(res.status).to.equal(500);
      expect(body).to.include('Parse failure');
    });

    it('runtime error', async () => {
      // if (isMacOS) return;
      const res = await fixture.fetch('/vue-runtime-error');
      expect(res.status).to.equal(500);
      const body = await res.text();
      expect(body).to.match(/Cannot read.*undefined/); // note: error differs slightly between Node versions
    });
  });
});

after(async () => {
  await devServer.stop();
});
