import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import del from 'del';
import { fileURLToPath } from 'url';

const Sitemap = suite('Sitemap Generation');

const snapshot = `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>https://mysite.dev/episode/fazers/</loc></url><url><loc>https://mysite.dev/episode/rap-snitch-knishes/</loc></url><url><loc>https://mysite.dev/episode/rhymes-like-dimes/</loc></url><url><loc>https://mysite.dev/episodes/</loc></url></urlset>`;

const cwd = new URL('./fixtures/astro-rss', import.meta.url);

const clear = () => del(path.join(fileURLToPath(cwd), 'dist')); // clear dist output

Sitemap.before(() => clear());
Sitemap.after(() => clear());

Sitemap('Generates Sitemap correctly', async () => {
  execSync('node ../../../astro.mjs build', { cwd: fileURLToPath(cwd) });
  const rss = await fs.promises.readFile(path.join(fileURLToPath(cwd), 'dist', 'sitemap.xml'), 'utf8');
  assert.match(rss, snapshot);
});

Sitemap.run();
