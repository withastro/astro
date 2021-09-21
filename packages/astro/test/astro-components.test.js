/**
 * UNCOMMENT: add support for functional components in frontmatter

import cheerio from 'cheerio';
import { loadFixture } from './test-utils.js';

let fixture;

beforeAll(async () => {
  fixture = await loadFixture({ projectRoot: './fixtures/astro-components/' });
  await fixture.build();
});

// TODO: add support for functional components in frontmatter
describe('Components tests', () => {
  test('Astro components are able to render framework components', async () => {
    const html = await fixture.readFile('/index.html');
    const $ = cheerio.load(html);

    // test 1: Renders Astro component
    const $astro = $('#astro');
    expect($astro.children()).toHaveLength(3);

    // test 2: Renders React component
    const $react = $('#react');
    expect($react).not.toHaveLength(0);

    // test 3: Renders Vue component
    const $vue = $('#vue');
    expect($vue).not.toHaveLength(0);

    // test 4: Renders Svelte component
    const $svelte = $('#svelte');
    expect($svelte).not.toHaveLength(0);
  });

  test('Allows Components defined in frontmatter', async () => {
    const html = await fixture.readFile('/frontmatter-component/index.html');
    const $ = cheerio.load(html);

    expect($('h1')).toHaveLength(1);
  });

  test('Still throws an error for undefined components', async () => {
    const result = await fixture.readFile('/undefined-component/index.html');
    expect(result.status).toBe(500);
  });

  test('Client attrs not added', async () => {
    const html = await fixture.readFile('/client/index.html');
    expect(html).not.toEqual(expect.stringMatching(/"client:load": true/));
  });
});
*/

test.skip('is skipped', () => {});
