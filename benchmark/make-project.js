import fs from 'fs/promises';

/**
 * @param {string} name
 */
export async function makeProject(name) {
	console.log('Making project:', name);
	const projectDir = new URL(`./projects/${name}/`, import.meta.url);

	/**
	 * NOTE: Here are the list of projects supported to generate programmatically
	 */
	switch (name) {
		case 'memory-default':
			await makeProjectMemoryDefault(projectDir);
			break;
		case 'server-stress-default':
			await makeProjectServerStressDefault(projectDir);
			break;
		default:
			throw new Error('Unknown project name: ' + name);
	}

	console.log('Finished making project:', name);
	return projectDir;
}

async function makeProjectMemoryDefault(projectDir) {
	await fs.rm(projectDir, { recursive: true, force: true });
	await fs.mkdir(new URL('./src/pages', projectDir), { recursive: true });

	const promises = [];

	for (let i = 0; i < 500; i++) {
		const content = `\
---
const i = ${i};
---

<span>{i}</span>
`;
		promises.push(
			fs.writeFile(new URL(`./src/pages/page-${i}.astro`, projectDir), content, 'utf-8')
		);
	}

	await Promise.all(promises);
}

async function makeProjectServerStressDefault(projectDir) {
	await fs.rm(projectDir, { recursive: true, force: true });
	await fs.mkdir(new URL('./src/pages', projectDir), { recursive: true });

	await fs.writeFile(
		new URL('./src/pages/index.astro', projectDir),
		`\
---
const content =
	"Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages, and more recently with desktop publishing software like Aldus PageMaker including versions of Lorem Ipsum. Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages, and more recently with desktop publishing software like Aldus PageMaker including versions of Lorem Ipsum.";
---

<html lang="en">
	<head>
		<meta charset="utf-8" />
		<meta name="viewport" content="width=device-width" />
		<meta name="generator" content={Astro.generator} />
		<title>Astro</title>
	</head>
	<body>
		<h1>Astro</h1>
		<div>
			${Array.from({ length: 60 }).map(() => '<p>{content}</p>')}
		</div>
	</body>
</html>`,
		'utf-8'
	);

	await fs.writeFile(
		new URL('./astro.config.js', projectDir),
		`\
import { defineConfig } from 'astro/config';
import nodejs from '@astrojs/node';

export default defineConfig({
	output: 'server',
	adapter: nodejs({ mode: 'standalone' }),
});`,
		'utf-8'
	);
}
