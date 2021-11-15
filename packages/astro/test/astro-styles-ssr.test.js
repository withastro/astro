import { expect } from 'chai';
import cheerio from 'cheerio';
import { loadFixture } from './test-utils.js';

let fixture;
let index$;
let bundledCSS;

before(async () => {
  fixture = await loadFixture({
    projectRoot: './fixtures/astro-styles-ssr/',
    renderers: ['@astrojs/renderer-react', '@astrojs/renderer-svelte', '@astrojs/renderer-vue'],
  });
  await fixture.build();

  // get bundled CSS (will be hashed, hence DOM query)
  const html = await fixture.readFile('/index.html');
  index$ = cheerio.load(html);
  const bundledCSSHREF = index$('link[rel=stylesheet][href^=assets/]').attr('href');
  bundledCSS = await fixture.readFile(bundledCSSHREF.replace(/^\/?/, '/'));
});

describe('Styles SSR', () => {
  describe('Astro styles', () => {
    it('HTML and CSS scoped correctly', async () => {
      const $ = index$;

      const el1 = $('#dynamic-class');
      const el2 = $('#dynamic-vis');
      const classes = $('#class').attr('class').split(' ');
      const scopedClass = classes.find((name) => /^astro-[A-Za-z0-9-]+/.test(name));

      // 1. check HTML
      expect(el1.attr('class')).to.equal(`blue ${scopedClass}`);
      expect(el2.attr('class')).to.equal(`visible ${scopedClass}`);

      // 2. check CSS
      expect(bundledCSS).to.include(`.blue.${scopedClass}{color:#b0e0e6}.color\\:blue.${scopedClass}{color:#b0e0e6}.visible.${scopedClass}{display:block}`);
    });

    it('No <style> skips scoping', async () => {
      const $ = index$;

      // Astro component without <style> should not include scoped class
      expect($('#no-scope').attr('class')).to.equal(undefined);
    });

    it('Child inheritance', async () => {
      const $ = index$;

      expect($('#passed-in').attr('class')).to.match(/outer astro-[A-Z0-9]+ astro-[A-Z0-9]+/);
    });

    it('Using hydrated components adds astro-root styles', async () => {
      expect(bundledCSS).to.include('display:contents');
    });
  });

  describe('JSX', () => {
    it('CSS', async () => {
      const $ = index$;
      const el = $('#react-css');

      // 1. check HTML
      expect(el.attr('class')).to.include('react-title');

      // 2. check CSS
      expect(bundledCSS).to.include('.react-title{');
    });

    it('CSS Modules', async () => {
      const $ = index$;
      const el = $('#react-modules');
      const classes = el.attr('class').split(' ');
      const moduleClass = classes.find((name) => /^_title_[A-Za-z0-9-_]+/.test(name));

      // 1. check HTML
      expect(el.attr('class')).to.include(moduleClass);

      // 2. check CSS
      expect(bundledCSS).to.include(`.${moduleClass}{`);
    });
  });

  describe('Vue', () => {
    it('CSS', async () => {
      const $ = index$;
      const el = $('#vue-css');

      // 1. check HTML
      expect(el.attr('class')).to.include('vue-title');

      // 2. check CSS
      expect(bundledCSS).to.include('.vue-title{');
    });

    // TODO: fix Vue scoped styles in build bug
    it.skip('Scoped styles', async () => {
      const $ = index$;
      const el = $('#vue-scoped');

      // find data-v-* attribute (how Vue CSS scoping works)
      const { attribs } = el.get(0);
      const scopeId = Object.keys(attribs).find((k) => k.startsWith('data-v-'));
      expect(scopeId).to.be.ok;

      // 1. check HTML
      expect(el.attr('class')).to.include('vue-scoped');

      // 2. check CSS
      expect(bundledCSS).to.include(`.vue-scoped[${scopeId}]`);
    });

    it('CSS Modules', async () => {
      const $ = index$;
      const el = $('#vue-modules');
      const classes = el.attr('class').split(' ');
      const moduleClass = classes.find((name) => /^_title_[A-Za-z0-9-_]+/.test(name));

      // 1. check HTML
      expect(el.attr('class')).to.include(moduleClass);

      // 2. check CSS
      expect(bundledCSS).to.include(`${moduleClass}{`);
    });
  });

  describe('Svelte', () => {
    it('Scoped styles', async () => {
      const $ = index$;
      const el = $('#svelte-scoped');
      const classes = el.attr('class').split(' ');
      const scopedClass = classes.find((name) => /^s-[A-Za-z0-9-]+/.test(name));

      // 1. check HTML
      expect(el.attr('class')).to.include('svelte-title');

      // 2. check CSS
      expect(bundledCSS).to.include(`.svelte-title.${scopedClass}`);
    });
  });
});
