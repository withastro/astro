// @ts-check
import { builtinDrivers } from 'unstorage';
import { promises as fs } from 'node:fs';

async function generateStorageReexports() {
	await fs.mkdir(new URL('../../packages/astro/src/storage/drivers', import.meta.url), { recursive: true });
	for (const key in builtinDrivers) {
		const exports = `// Auto-generated file. Do not edit\nexport { default } from "${builtinDrivers[key]}";`;
		await fs.writeFile(new URL(`../../packages/astro/src/storage/drivers/${key}.js`, import.meta.url), exports);
	}
}

generateStorageReexports();
