import fs from 'fs';

const pages = new URL('./project/src/pages/', import.meta.url);

for(let i = 0; i < 100; i++) {
	let content = `---
const i = ${i};
---
<span>{i}</span>`;
	await fs.promises.writeFile(new URL(`./page-${i}.astro`, pages), content, 'utf-8');
}
