/**
 * UNCOMMENT: add support for custom elements
import { expect } from 'chai';
import cheerio from 'cheerio';
import { loadFixture } from './test-utils.js';

let fixture;

before(async () => {
  fixture = await loadFixture({
    projectRoot: './fixtures/custom-elements/',
    renderers: ['@astrojs/test-custom-element-renderer'],
  });
  await fixture.build();
});

describe('Custom Elements', () => {
  it('Work as constructors', async () => {
    const html = await fixture.readFile('/ctr/index.html');
    const $ = cheerio.load(html);

    // test 1: Element rendered
    expect($('my-element')).to.have.lengthOf(1);

    // test 2: shadow rendererd
    expect($('my-element template[shadowroot=open]')).to.have.lengthOf(1);
  });

  it('Works with exported tagName', async () => {
    const html = await fixture.readFile('/index.html');
    const $ = cheerio.load(html);

    // test 1: Element rendered
    expect($('my-element')).to.have.lengthOf(1);

    // test 2: shadow rendered
    expect($('my-element template[shadowroot=open]')).to.have.lengthOf(1);
  });

  it('Hydration works with exported tagName', async () => {
    const html = await fixture.readFile('/load/index.html');
    const $ = cheerio.load(html);

    // SSR
    // test 1: Element rendered
    expect($('my-element')).to.have.lengthOf(1);

    // test 2: shadow rendered
    expect($('my-element template[shadowroot=open]')).to.have.lengthOf(1);

    // Hydration
    // test 3: Component URL is included
    expect(html).to.include('/src/components/my-element.js');
  });

  it('Polyfills are added before the hydration script', async () => {
    const html = await fixture.readFile('/load/index.html');
    const $ = cheerio.load(html);

    expect($('script[type=module]')).to.have.lengthOf(2);
    expect($('script[type=module]').attr('src')).to.equal('/_snowpack/link/packages/astro/test/fixtures/custom-elements/my-component-lib/polyfill.js');
    expect($($('script[type=module]').get(1)).html()).to.include('/_snowpack/link/packages/astro/test/fixtures/custom-elements/my-component-lib/hydration-polyfill.js');
  });

  it('Polyfills are added even if not hydrating', async () => {
    const html = await fixture.readFile('/index.html');
    const $ = cheerio.load(html);

    expect($('script[type=module]')).to.have.lengthOf(1);
    expect($('script[type=module]').attr('src')).to.equal('/_snowpack/link/packages/astro/test/fixtures/custom-elements/my-component-lib/polyfill.js');
    expect($($('script[type=module]').get(1)).html()).not.to.include(
      '/_snowpack/link/packages/astro/test/fixtures/custom-elements/my-component-lib/hydration-polyfill.js'
    );
  });

  it('Custom elements not claimed by renderer are rendered as regular HTML', async () => {
    const html = await fixture.readFile('/nossr/index.html');
    const $ = cheerio.load(html);

    // test 1: Rendered the client-only element
    expect($('client-element')).to.have.lengthOf(1);
  });

  it('Can import a client-only element that is nested in JSX', async () => {
    const html = await fixture.readFile('/nested/index.html');
    const $ = cheerio.load(html);

    // test 1: Element rendered
    expect($('client-only-element')).to.have.lengthOf(1);
  });
});
*/

it.skip('is skipped', () => {});
