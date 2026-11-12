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
const preset = fileURLToPath(new URL('../../../tsconfigs/strict.json', import.meta.url));
const template = readFileSync(
	new URL('../../../templates/content/types.d.ts', import.meta.url),
	'utf8',
);

async function typecheck(config?: string, consumer = '') {
	const generated = template
		.replace('// @@DATA_ENTRY_MAP@@', '')
		.replace("'@@CONTENT_CONFIG_TYPE@@'", 'never')
		.replace(
			"'@@LIVE_CONTENT_CONFIG_TYPE@@'",
			config ? "typeof import('./live.config.js')" : 'never',
		);
	const fixture = await createFixture({
		'/package.json': '{"type":"module"}',
		// A .ts input checks the generated ambient declarations without checking dependency .d.ts files.
		'/generated.ts': generated,
		'/live.config.ts': config ?? '',
		'/consumer.ts': consumer,
		'/tsconfig.json': JSON.stringify({
			extends: preset,
			compilerOptions: {
				types: ['node'],
				paths: {
					astro: [fileURLToPath(new URL('../../../dist/types/public/index.d.ts', import.meta.url))],
					'astro/loaders': [
						fileURLToPath(new URL('../../../dist/content/loaders/index.d.ts', import.meta.url)),
					],
					'astro/zod': [fileURLToPath(new URL('../../../dist/zod.d.ts', import.meta.url))],
					'astro/runtime/server/index.js': [
						fileURLToPath(new URL('../../../dist/runtime/server/index.d.ts', import.meta.url)),
					],
				},
			},
			files: ['generated.ts', 'consumer.ts'],
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
		assert.equal(result.status, 0, result.stdout + result.stderr);
	} finally {
		await fixture.rm();
	}
}

describe('generated live content types', () => {
	it('checks declarations without a live config', async () => {
		await typecheck();
	});
	for (const kind of ['default filters', 'typed filters', 'schema override']) {
		it(`preserves loader inference with ${kind}`, async () => {
			const filters = kind !== 'default filters';
			const schema = kind === 'schema override';
			const data = schema ? '{ title: string }' : '{ body: string }';
			await typecheck(
				`
				import type { LiveLoader } from 'astro/loaders';
				import { z } from 'astro/zod';
				export class LoaderError extends Error { readonly source = 'loader' as const; }
				declare const loader: LiveLoader<${
					filters
						? '{ body: string }, { slug: string }, { limit: number }, LoaderError'
						: '{ body: string }'
				}>;
				export const collections = {
					articles: { loader, schema: ${schema ? 'z.object({ title: z.string() })' : 'undefined'} },
				};
				`,
				`
				import { expectTypeOf } from 'expect-type';
				import { getLiveCollection, getLiveEntry } from 'astro:content';
				import type { LiveDataEntryResult } from 'astro';
				import type { LoaderError } from './live.config.js';
				const result = await getLiveEntry('articles', ${filters ? "{ slug: 'one' }" : "'one'"});
				expectTypeOf(result.entry!.data).toEqualTypeOf<${data}>();
				expectTypeOf(result.error).toEqualTypeOf<LiveDataEntryResult<${data}, ${filters ? 'LoaderError' : 'Error'}>['error']>();
				const collection = await getLiveCollection('articles'${filters ? ', { limit: 10 }' : ''});
				expectTypeOf(collection.entries![0].data).toEqualTypeOf<${data}>();
				// @ts-expect-error Entry filters reject a numeric slug.
				getLiveEntry('articles', { slug: 1 });
				// @ts-expect-error Collection filters reject a string limit.
				getLiveCollection('articles', { limit: 'many' });
				// @ts-expect-error Only configured collection names are accepted.
				getLiveEntry('unknown', 'one');
				`,
			);
		});
	}
});
