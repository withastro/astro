/**
 * CSS test
 * Run this test first! This uses quite a bit of memory, so prefixing with `0-` helps it start and finish early,
 * rather than trying to start up when all other threads are busy and having to fight for resources
 */

import { expect } from 'chai';
import cheerio from 'cheerio';
import { loadFixture } from './test-utils.js';

describe('Styles SSR', function () {
  this.timeout(30000); // test needs a little more time in CI

  let fixture;
  let index$;
  let bundledCSS;

  before(async () => {
    fixture = await loadFixture({
      projectRoot: './fixtures/0-css/',
      renderers: ['@astrojs/renderer-react', '@astrojs/renderer-svelte', '@astrojs/renderer-vue'],
    });
    await fixture.build();

    // get bundled CSS (will be hashed, hence DOM query)
    const html = await fixture.readFile('/index.html');
    index$ = cheerio.load(html);
    const bundledCSSHREF = index$('link[rel=stylesheet][href^=assets/]').attr('href');
    bundledCSS = await fixture.readFile(bundledCSSHREF.replace(/^\/?/, '/'));
  });

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

    it('<style lang="sass">', async () => {
      expect(bundledCSS).to.match(new RegExp('h1.astro-[^{]*{color:#90ee90}'));
    });

    it('<style lang="scss">', async () => {
      expect(bundledCSS).to.match(new RegExp('h1.astro-[^{]*{color:#ff69b4}'));
    });
  });

  describe('Styles in src/', () => {
    it('.css', async () => {
      expect(bundledCSS).to.match(new RegExp('.linked-css[^{]*{color:gold'));
    });

    it('.sass', async () => {
      expect(bundledCSS).to.match(new RegExp('.linked-sass[^{]*{color:#789'));
    });

    it('.scss', async () => {
      expect(bundledCSS).to.match(new RegExp('.linked-scss[^{]*{color:#6b8e23'));
    });
  });

  describe('JSX', () => {
    it('.css', async () => {
      const $ = index$;
      const el = $('#react-css');

      // 1. check HTML
      expect(el.attr('class')).to.include('react-title');

      // 2. check CSS
      expect(bundledCSS).to.include('.react-title{');
    });

    it('.module.css', async () => {
      const $ = index$;
      const el = $('#react-module-css');
      const classes = el.attr('class').split(' ');
      const moduleClass = classes.find((name) => /^_title_[A-Za-z0-9-_]+/.test(name));

      // 1. check HTML
      expect(el.attr('class')).to.include(moduleClass);

      // 2. check CSS
      expect(bundledCSS).to.match(new RegExp(`.${moduleClass}[^{]*{font-family:fantasy}`));
    });

    it('.sass', async () => {
      const $ = index$;
      const el = $('#react-sass');

      // 1. check HTML
      expect(el.attr('class')).to.include('react-sass-title');

      // 2. check CSS
      expect(bundledCSS).to.match(new RegExp(`.react-sass-title[^{]*{font-family:fantasy}`));
    });

    it('.scss', async () => {
      const $ = index$;
      const el = $('#react-scss');

      // 1. check HTML
      expect(el.attr('class')).to.include('react-scss-title');

      // 2. check CSS
      expect(bundledCSS).to.match(new RegExp(`.react-scss-title[^{]*{font-family:fantasy}`));
    });

    it('.module.sass', async () => {
      const $ = index$;
      const el = $('#react-module-sass');
      const classes = el.attr('class').split(' ');
      const moduleClass = classes.find((name) => /^_title_[A-Za-z0-9-_]+/.test(name));

      // 1. check HTML
      expect(el.attr('class')).to.include(moduleClass);

      // 2. check CSS
      expect(bundledCSS).to.match(new RegExp(`.${moduleClass}[^{]*{font-family:fantasy}`));
    });

    it('.module.scss', async () => {
      const $ = index$;
      const el = $('#react-module-scss');
      const classes = el.attr('class').split(' ');
      const moduleClass = classes.find((name) => /^_title_[A-Za-z0-9-_]+/.test(name));

      // 1. check HTML
      expect(el.attr('class')).to.include(moduleClass);

      // 2. check CSS
      expect(bundledCSS).to.match(new RegExp(`.${moduleClass}[^{]*{font-family:fantasy}`));
    });
  });

  describe('Vue', () => {
    it('<style>', async () => {
      const $ = index$;
      const el = $('#vue-css');

      // 1. check HTML
      expect(el.attr('class')).to.include('vue-css');

      // 2. check CSS
      expect(bundledCSS).to.match(new RegExp(`.vue-css[^{]*{font-family:cursive`));
    });

    it('<style scoped>', async () => {
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

    it('<style module>', async () => {
      const $ = index$;
      const el = $('#vue-modules');
      const classes = el.attr('class').split(' ');
      const moduleClass = classes.find((name) => /^_title_[A-Za-z0-9-_]+/.test(name));

      // 1. check HTML
      expect(el.attr('class')).to.include(moduleClass);

      // 2. check CSS
      expect(bundledCSS).to.include(`${moduleClass}{`);
    });

    it('<style lang="sass">', async () => {
      const $ = index$;
      const el = $('#vue-sass');

      // 1. check HTML
      expect(el.attr('class')).to.include('vue-sass');

      // 2. check CSS
      expect(bundledCSS).to.match(new RegExp(`.vue-sass[^{]*{font-family:cursive`));
    });

    it('<style lang="scss">', async () => {
      const $ = index$;
      const el = $('#vue-scss');

      // 1. check HTML
      expect(el.attr('class')).to.include('vue-scss');

      // 2. check CSS
      expect(bundledCSS).to.match(new RegExp(`.vue-scss[^{]*{font-family:cursive`));
    });
  });

  describe('Svelte', () => {
    it('<style>', async () => {
      const $ = index$;
      const el = $('#svelte-css');
      const classes = el.attr('class').split(' ');
      const scopedClass = classes.find((name) => /^s-[A-Za-z0-9-]+/.test(name));

      // 1. check HTML
      expect(el.attr('class')).to.include('svelte-css');

      // 2. check CSS
      expect(bundledCSS).to.match(new RegExp(`.svelte-css.${scopedClass}[^{]*{font-family:"Comic Sans MS"`));
    });

    it('<style lang="sass">', async () => {
      const $ = index$;
      const el = $('#svelte-sass');
      const classes = el.attr('class').split(' ');
      const scopedClass = classes.find((name) => /^s-[A-Za-z0-9-]+/.test(name));

      // 1. check HTML
      expect(el.attr('class')).to.include('svelte-sass');

      // 2. check CSS
      expect(bundledCSS).to.match(new RegExp(`.svelte-sass.${scopedClass}[^{]*{font-family:"Comic Sans MS"`));
    });

    it('<style lang="scss">', async () => {
      const $ = index$;
      const el = $('#svelte-scss');
      const classes = el.attr('class').split(' ');
      const scopedClass = classes.find((name) => /^s-[A-Za-z0-9-]+/.test(name));

      // 1. check HTML
      expect(el.attr('class')).to.include('svelte-scss');

      // 2. check CSS
      expect(bundledCSS).to.match(new RegExp(`.svelte-scss.${scopedClass}[^{]*{font-family:"Comic Sans MS"`));
    });
  });
});
