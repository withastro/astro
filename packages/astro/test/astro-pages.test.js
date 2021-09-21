import cheerio from 'cheerio';
import { loadFixture } from './test-utils.js';

let fixture;

beforeAll(async () => {
  fixture = await loadFixture({ projectRoot: './fixtures/astro-pages/' });
  await fixture.build();
});

describe('Pages', () => {
  test('Can find page with "index" at the end file name', async () => {
    const html = await fixture.readFile('/posts/name-with-index/index.html');
    const $ = cheerio.load(html);

    expect($('h1').text()).toBe('Name with index');
  });
});
