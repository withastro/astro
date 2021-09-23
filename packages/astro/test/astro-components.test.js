/**
 * UNCOMMENT: add support for functional components in frontmatter
import { expect } from 'chai';
import cheerio from 'cheerio';
import { loadFixture } from './test-utils.js';

let fixture;

before(async () => {
  fixture = await loadFixture({ projectRoot: './fixtures/astro-components/' });
  await fixture.build();
});

// TODO: add support for functional components in frontmatter
describe('Components tests', () => {
  it('Astro components are able to render framework components', async () => {
    const html = await fixture.readFile('/index.html');
    const $ = cheerio.load(html);

    // test 1: Renders Astro component
    const $astro = $('#astro');
    expect($astro.children()).to.have.lengthOf(3);

    // test 2: Renders React component
    const $react = $('#react');
    expect($react).not.to.have.lengthOf(0);

    // test 3: Renders Vue component
    const $vue = $('#vue');
    expect($vue).not.to.have.lengthOf(0);

    // test 4: Renders Svelte component
    const $svelte = $('#svelte');
    expect($svelte).not.to.have.lengthOf(0);
  });

  it('Allows Components defined in frontmatter', async () => {
    const html = await fixture.readFile('/frontmatter-component/index.html');
    const $ = cheerio.load(html);

    expect($('h1')).to.have.lengthOf(1);
  });

  it('Still throws an error for undefined components', async () => {
    const result = await fixture.readFile('/undefined-component/index.html');
    expect(result.status).to.equal(500);
  });

  it('Client attrs not added', async () => {
    const html = await fixture.readFile('/client/index.html');
    expect(html).not.to.include(`"client:load": true`);
  });
});
*/

it.skip('is skipped', () => {});
