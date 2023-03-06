import fs from 'fs/promises';
import { loremIpsumHtml, loremIpsumMd } from './_util.js';

// Map of files to be generated and tested for rendering.
// Ideally each content should be similar for comparison.
export const renderFiles = {
	'astro.astro': `\
---
const className = "text-red-500";
const style = { color: "red" };
const items = Array.from({ length: 1000 }, (_, i) => i);
---

<html>
  <head>
    <title>My Site</title>
  </head>
  <body>
    <h1 class={className + ' text-lg'}>List</h1>
    <ul style={style}>
      {items.map((item) => (
        <li class={className}>{item}</li>
      ))}
    </ul>
    ${Array.from({ length: 1000 })
			.map(() => `<p>${loremIpsumHtml}</p>`)
			.join('\n')}
  </body>
</html>`,
	'md.md': `\
# List

${Array.from({ length: 1000 }, (_, i) => i)
	.map((v) => `- ${v}`)
	.join('\n')}

${Array.from({ length: 1000 })
	.map(() => loremIpsumMd)
	.join('\n\n')}
`,
	'mdx.mdx': `\
export const className = "text-red-500";
export const style = { color: "red" };
export const items = Array.from({ length: 1000 }, (_, i) => i);

# List

<ul style={style}>
  {items.map((item) => (
    <li class={className}>{item}</li>
  ))}
</ul>

${Array.from({ length: 1000 })
	.map(() => loremIpsumMd)
	.join('\n\n')}
`,
};

/**
 * @param {URL} projectDir
 */
export async function run(projectDir) {
	await fs.rm(projectDir, { recursive: true, force: true });
	await fs.mkdir(new URL('./src/pages', projectDir), { recursive: true });

	await Promise.all(
		Object.entries(renderFiles).map(([name, content]) => {
			return fs.writeFile(new URL(`./src/pages/${name}`, projectDir), content, 'utf-8');
		})
	);

	await fs.writeFile(
		new URL('./astro.config.js', projectDir),
		`\
import { defineConfig } from 'astro/config';
import timer from '@astrojs/timer';
import mdx from '@astrojs/mdx';

export default defineConfig({
  integrations: [mdx()],
	output: 'server',
	adapter: timer(),
});`,
		'utf-8'
	);
}
