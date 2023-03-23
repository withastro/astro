import fastglob from 'fast-glob';
import { fileURLToPath } from 'node:url';
import * as fs from 'node:fs';

const result = await fastglob(fileURLToPath(new URL('./src/**/*.wasm', import.meta.url)));

for (const filepath of result) {
	const buffer = await fs.promises.readFile(filepath);
	const base64 = buffer.toString('base64');
	const source = `export default Buffer.from(${JSON.stringify(base64)}, 'base64');`;
	const outpath = filepath + '.ts';
	await fs.promises.writeFile(outpath, source, 'utf-8');
}
