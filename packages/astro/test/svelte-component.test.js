import { expect } from 'chai';
import cheerio from 'cheerio';
import { loadFixture } from './test-utils.js';

describe('Svelte component', () => {
  let fixture;

  before(async () => {
    fixture = await loadFixture({
      projectRoot: './fixtures/svelte-component/',
      renderers: ['@astrojs/renderer-svelte'],
    });
    await fixture.build();
  });

  it('Works with TypeScript', async () => {
    const html = await fixture.readFile('/typescript/index.html');
    const $ = cheerio.load(html);

    expect($('#svelte-ts').text()).to.equal('Hello, TypeScript');
  });
});
