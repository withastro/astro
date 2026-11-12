import * as assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';
import { createFixture } from '../test-utils.ts';

const compilerPackage = fileURLToPath(import.meta.resolve('typescript/package.json'));
const compilerMetadata = JSON.parse(readFileSync(compilerPackage, 'utf8')) as {
	bin: { tsc: string };
};
const compiler = resolve(dirname(compilerPackage), compilerMetadata.bin.tsc);
const placeholder = fileURLToPath(new URL('../../../types/content.d.ts', import.meta.url));
const preset = fileURLToPath(new URL('../../../tsconfigs/strict.json', import.meta.url));
const generated = `declare module 'astro:content' {
	export type CollectionKey = 'posts';
	export function getEntry(collection: CollectionKey, id: string): Promise<{ id: string }>;
}`;

async function typecheck(source: string, order: 'none' | 'first' | 'last') {
	const declarations =
		order === 'none'
			? [placeholder]
			: order === 'first'
				? ['generated.d.ts', placeholder]
				: [placeholder, 'generated.d.ts'];
	const fixture = await createFixture({
		'/package.json': '{"type":"module"}',
		'/consumer.ts': source,
		'/generated.d.ts': generated,
		'/tsconfig.json': JSON.stringify({
			extends: preset,
			compilerOptions: { types: ['node'] },
			files: [...declarations, 'consumer.ts'],
			include: [],
		}),
	});
	try {
		const result = spawnSync(
			process.execPath,
			[compiler, '--project', fixture.path, '--pretty', 'false'],
			{
				encoding: 'utf8',
				timeout: 30_000,
			},
		);
		assert.ifError(result.error);
		assert.equal(result.signal, null, result.stderr);
		return result;
	} finally {
		await fixture.rm();
	}
}

describe('content placeholder exports', () => {
	it('provides fallback exports before generation', async () => {
		const result = await typecheck(
			`
			import { getEntry, type CollectionKey } from 'astro:content';
			const key: CollectionKey = 'before-sync';
			const value: number = getEntry(key, 'entry');
			void value;
		`,
			'none',
		);
		assert.equal(result.status, 0, result.stdout + result.stderr);
	});

	for (const order of ['first', 'last'] as const) {
		it(`uses generated signatures when generated declarations are ${order}`, async () => {
			const valid = await typecheck(
				`
				import { getEntry, type CollectionKey } from 'astro:content';
				const key: CollectionKey = 'posts';
				const value: Promise<{ id: string }> = getEntry(key, 'entry');
				void value;
			`,
				order,
			);
			assert.equal(valid.status, 0, valid.stdout + valid.stderr);

			const invalid = await typecheck(
				`
				import { getEntry, type CollectionKey } from 'astro:content';
				const key: CollectionKey = 'unknown';
				getEntry('unknown', 'entry');
				void key;
			`,
				order,
			);
			assert.notEqual(invalid.status, 0, invalid.stdout + invalid.stderr);
			const codes = [...invalid.stdout.matchAll(/error (TS\d+):/g)].map((match) => match[1]);
			assert.deepEqual(codes.sort(), ['TS2322', 'TS2345']);
		});
	}
});
