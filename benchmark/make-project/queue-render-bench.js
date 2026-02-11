import fs from 'node:fs/promises';

// Queue rendering benchmark - tests SSR rendering performance with queue-based engine
const files = {
	'pages/astro.astro': `\
---
const className = "text-red-500";
const style = { color: "red" };
const items = Array.from({ length: 10000 }, (_, i) => ({ i }));
---
<html>
  <head>
    <title>Queue Rendering Benchmark</title>
  </head>
  <body>
    <h1 class={className + ' text-lg'}>Queue Rendering List</h1>
		<ul style={style}>
		{items.map((item) => (
			<li class={className}>
				<a
					href={item.i}
					aria-current={item.i === 0}
					class:list={[{ large: item.i === 0 }, className]}
				>
					<span>{item.i}</span>
				</a>
			</li>
		))}
		</ul>
  </body>
</html>`,
};

/**
 * @param {URL} projectDir
 */
export async function run(projectDir) {
	await fs.rm(projectDir, { recursive: true, force: true });
	await fs.mkdir(new URL('./src/pages', projectDir), { recursive: true });

	await Promise.all(
		Object.entries(files).map(([name, content]) => {
			return fs.writeFile(new URL(`./src/${name}`, projectDir), content, 'utf-8');
		}),
	);

	await fs.writeFile(
		new URL('./astro.config.js', projectDir),
		`\
import { defineConfig } from 'astro/config';
import adapter from '@benchmark/adapter';

export default defineConfig({
	output: 'server',
	adapter: adapter(),
	experimental: {
		queuedRendering: true,
	},
});`,
		'utf-8',
	);
}
