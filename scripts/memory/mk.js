import fs from 'fs';

const base = new URL('./project/', import.meta.url);
const pages = new URL('./src/pages/', base);

await fs.promises.writeFile(new URL('./package.json', base), `{
  "name": "@test/smoke",
  "version": "0.0.0",
  "private": true,
  "dependencies": {
    "astro": "workspace:*"
  }
}`);

for (let i = 0; i < 100; i++) {
	let content = `---
const i = ${i};
---
<span>{i}</span>`;
	await fs.promises.writeFile(new URL(`./page-${i}.astro`, pages), content, 'utf-8');
}
