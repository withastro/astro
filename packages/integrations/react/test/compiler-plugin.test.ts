import assert from 'node:assert/strict';
import { before, describe, it } from 'node:test';
import { reactCompilerPlugin } from '../dist/compiler.js';

const code = 'export default function Greeting({ name }) { return <h1>Hello {name}</h1>; }';

describe('Oxc compiler transform', () => {
	const plugin = reactCompilerPlugin(true, { exclude: [/\.astro$/, /excluded/] });
	const context = {
		environment: { config: { consumer: 'client' } },
		error(message: string): never {
			throw new Error(message);
		},
	};
	before(async () => {
		assert.ok(typeof plugin.config === 'function');
		await plugin.config.call(context as never, {}, {} as never);
	});
	async function transform(id: string, ssr = false) {
		assert.ok(typeof plugin.transform === 'function');
		return plugin.transform.call(context as never, code, id, { ssr, moduleType: 'jsx' });
	}
	it('memoizes client JSX with the React 18 runtime and a source map', async () => {
		const result = await transform('/src/Greeting.jsx?import');
		assert.ok(result && typeof result === 'object');
		assert.match(String(result.code), /react-compiler-runtime/);
		assert.match(String(result.code), /\$\[/);
		assert.ok(result.map);
	});
	it('leaves server transforms untouched', async () => {
		assert.equal(await transform('/src/Greeting.jsx', true), undefined);
	});
	for (const id of [
		'/src/excluded.jsx',
		'/node_modules/example/index.jsx',
		'/src/Page.astro?astro&type=script&lang.ts',
		'/src/style.css',
	]) {
		it(`does not compile ${id}`, async () => {
			assert.equal(await transform(id), undefined);
		});
	}
});
