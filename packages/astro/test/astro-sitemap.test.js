import { expect } from 'chai';
import { loadFixture } from './test-utils.js';

let fixture;

before(async () => {
  fixture = await loadFixture({
    projectRoot: './fixtures/astro-rss/',
    buildOptions: {
      site: 'https://astro.build/',
      sitemap: true,
    },
  });
  await fixture.build();
});

describe('Sitemap Generation', () => {
  it('Generates Sitemap correctly', async () => {
    let sitemap = await fixture.readFile('/sitemap.xml');
    expect(sitemap).to.equal(
      `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>https://astro.build/404/index.html</loc></url><url><loc>https://astro.build/episode/fazers/index.html</loc></url><url><loc>https://astro.build/episode/rap-snitch-knishes/index.html</loc></url><url><loc>https://astro.build/episode/rhymes-like-dimes/index.html</loc></url><url><loc>https://astro.build/episodes/index.html</loc></url></urlset>\n`
    );
  });
});
