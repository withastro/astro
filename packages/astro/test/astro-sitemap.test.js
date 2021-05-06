import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import { setupBuild } from './helpers.js';

const Sitemap = suite('Sitemap Generation');

setupBuild(Sitemap, './fixtures/astro-rss');

const snapshot = `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>https://mysite.dev/episode/fazers/</loc></url><url><loc>https://mysite.dev/episode/rap-snitch-knishes/</loc></url><url><loc>https://mysite.dev/episode/rhymes-like-dimes/</loc></url><url><loc>https://mysite.dev/episodes/</loc></url></urlset>\n`;

Sitemap('Generates Sitemap correctly', async (context) => {
  await context.build();
  let sitemap = await context.readFile('/sitemap.xml');
  assert.match(sitemap, snapshot);
});

Sitemap.run();
