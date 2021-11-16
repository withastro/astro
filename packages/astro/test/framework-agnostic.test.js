import { expect } from 'chai';
import cheerio from 'cheerio';
import { loadFixture } from './test-utils.js';

describe('Framework Agnostic components', () => {
  let fixture;

  before(async () => {
    fixture = await loadFixture({ projectRoot: './fixtures/framework-agnostic/' });
    await fixture.build();
  });

  it('works', async () => {
    const html = await fixture.readFile('/index.html');
    console.log(html);
  });
});