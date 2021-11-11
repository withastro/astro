import { expect } from 'chai';
import cheerio from 'cheerio';
import { loadFixture } from './test-utils.js';

describe('Styles SSR', () => {
  let fixture;

  before(async () => {
    fixture = await loadFixture({ projectRoot: './fixtures/astro-styles-ssr/' });
    await fixture.build();
  });

  it('Has <link> tags', async () => {
    const MUST_HAVE_LINK_TAGS = ['assets/index'];

    const html = await fixture.readFile('/index.html');
    const $ = cheerio.load(html);

    for (const href of [...$('link[rel="stylesheet"]')].map((el) => el.attribs.href)) {
      const hasTag = MUST_HAVE_LINK_TAGS.some((mustHaveHref) => href.includes(mustHaveHref));
      expect(hasTag).to.equal(true);
    }
  });

  it('Has correct CSS classes', async () => {
    const html = await fixture.readFile('/index.html');
    const $ = cheerio.load(html);

    const MUST_HAVE_CLASSES = {
      '#react-css': 'react-title',
      '#react-modules': 'title', // ⚠️  this should be transformed
      '#vue-css': 'vue-title',
      '#vue-modules': 'title', // ⚠️  this should also be transformed
      '#vue-scoped': 'vue-title', // also has data-v-* property
      '#svelte-scoped': 'svelte-title', // also has additional class
    };

    for (const [selector, className] of Object.entries(MUST_HAVE_CLASSES)) {
      const el = $(selector);
      if (selector === '#react-modules' || selector === '#vue-modules') {
        // this will generate differently on Unix vs Windows. Here we simply test that it has transformed
        expect(el.attr('class')).to.match(new RegExp(`^_${className}_[A-Za-z0-9-_]+`)); // className should be transformed, surrounded by underscores and other stuff
      } else {
        // if this is not a CSS module, it should remain as expected
        expect(el.attr('class')).to.include(className);
      }

      // add’l test: Vue Scoped styles should have data-v-* attribute
      if (selector === '#vue-scoped') {
        const { attribs } = el.get(0);
        const scopeId = Object.keys(attribs).find((k) => k.startsWith('data-v-'));
        expect(scopeId).to.be.ok;
      }

      // add’l test: Svelte should have another class
      if (selector === '#svelte-title') {
        expect(el.attr('class')).not.to.equal(className);
      }
    }
  });

  it('CSS scoped support in .astro', async () => {
    const html = await fixture.readFile('/index.html');
    const $ = cheerio.load(html);

    const href = '/' + $('link').attr('href');
    const raw = await fixture.readFile(href);

    let scopedClass;

    // test 1: <style> tag in <head> is transformed
    const css = raw.replace(/\.astro-[A-Za-z0-9-]+/, (match) => {
      scopedClass = match; // get class hash from result
      return match;
    });

    expect(css).to.include(`.wrapper${scopedClass}{margin-left:auto;margin-right:auto;max-width:1200px;}.outer${scopedClass}{color:red;}`);

    // test 2: element received .astro-XXXXXX class (this selector will succeed if transformed correctly)
    const wrapper = $(`.wrapper${scopedClass}`);
    expect(wrapper).to.have.lengthOf(1);
  });

  it('Astro scoped styles', async () => {
    const html = await fixture.readFile('/index.html');
    const $ = cheerio.load(html);

    const el1 = $('#dynamic-class');
    const el2 = $('#dynamic-vis');

    let scopedClass;

    $('#class')
      .attr('class')
      .replace(/astro-[A-Za-z0-9-]+/, (match) => {
        scopedClass = match;
        return match;
      });

    // test 1: Astro component has some scoped class
    expect(scopedClass).to.be.ok;

    // test 2–3: children get scoped class
    expect(el1.attr('class')).to.equal(`blue ${scopedClass}`);
    expect(el2.attr('class')).to.equal(`visible ${scopedClass}`);

    const href = '/' + $('link').attr('href');
    const css = await fixture.readFile(href);

    // test 4: CSS generates as expected
    expect(css).to.include(`.blue.${scopedClass}{color:powderblue;}.color\\:blue.${scopedClass}{color:powderblue;}.visible.${scopedClass}{display:block;}`);
  });

  it('Astro scoped styles skipped without <style>', async () => {
    const html = await fixture.readFile('/index.html');
    const $ = cheerio.load(html);

    // test 1: Astro component without <style> should not include scoped class
    expect($('#no-scope').attr('class')).to.equal(undefined);
  });

  it('Astro scoped styles can be passed to child components', async () => {
    const html = await fixture.readFile('/index.html');
    const $ = cheerio.load(html);

    expect($('#passed-in').attr('class')).to.match(/outer astro-[A-Z0-9]+ astro-[A-Z0-9]+/);
  });
});
