import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { after, describe, it } from 'node:test';
import { pathToFileURL } from 'node:url';
import {
	getDirectives,
	getScriptHashes,
	getScriptResources,
	getStyleHashes,
	getStyleResources,
	trackScriptIntegrity,
} from '../../../dist/core/csp/common.js';
import { generateCspDigest } from '@astrojs/runtime/_internal/core/encryption.js';

function buildSettings({ csp, injected }: { csp: any; injected: string[] }): any {
	const settings = {
		config: {
			security: { csp },
		},
		injectedCsp: {
			fontResources: new Set(injected),
		},
	};
	return settings;
}

describe('CSP common', () => {
	it('getDirectives()', () => {
		assert.deepStrictEqual(
			getDirectives(
				buildSettings({
					csp: false,
					injected: [],
				}),
			),
			[],
		);
		assert.deepStrictEqual(
			getDirectives(
				buildSettings({
					csp: true,
					injected: [],
				}),
			),
			[],
		);
		assert.deepStrictEqual(
			getDirectives(
				buildSettings({
					csp: {
						algorithm: 'SHA-256',
						directives: ['font-src test'],
					},
					injected: [],
				}),
			),
			['font-src test'],
		);
		assert.deepStrictEqual(
			getDirectives(
				buildSettings({
					csp: {
						algorithm: 'SHA-256',
						directives: ['img-src test'],
					},
					injected: ["'self'", 'foo'],
				}),
			),
			['img-src test', "font-src 'self' foo"],
		);
		assert.deepStrictEqual(
			getDirectives(
				buildSettings({
					csp: {
						algorithm: 'SHA-256',
						directives: ["font-src 'self' ", 'img-src test'],
					},
					injected: ["'self'", 'foo'],
				}),
			),
			["font-src 'self' foo", 'img-src test'],
		);
	});

	it('directive getters return the config entries as-authored (kind kept inline)', () => {
		const csp = {
			algorithm: 'SHA-256',
			scriptDirective: {
				resources: ["'self'", { resource: 'https://cdn', kind: 'element' }],
				hashes: ['sha256-AAA', { hash: 'sha256-BBB', kind: 'attribute' }],
			},
			styleDirective: {
				resources: [{ resource: "'unsafe-inline'", kind: 'attribute' }],
			},
		} as any;

		assert.deepStrictEqual(getScriptResources(csp), [
			"'self'",
			{ resource: 'https://cdn', kind: 'element' },
		]);
		assert.deepStrictEqual(getScriptHashes(csp), [
			'sha256-AAA',
			{ hash: 'sha256-BBB', kind: 'attribute' },
		]);
		assert.deepStrictEqual(getStyleResources(csp), [
			{ resource: "'unsafe-inline'", kind: 'attribute' },
		]);
		assert.deepStrictEqual(getStyleHashes(csp), []);
	});

	it('directive getters return empty arrays for csp: true', () => {
		assert.deepStrictEqual(getScriptResources(true as any), []);
		assert.deepStrictEqual(getScriptHashes(true as any), []);
		assert.deepStrictEqual(getStyleResources(true as any), []);
		assert.deepStrictEqual(getStyleHashes(true as any), []);
	});
});

describe('trackScriptIntegrity()', () => {
	const root = mkdtempSync(join(tmpdir(), 'astro-csp-integrity-'));
	mkdirSync(join(root, '_astro'));
	writeFileSync(join(root, '_astro', 'page.js'), 'import "./chunk.js";');
	writeFileSync(join(root, '_astro', 'chunk.js'), 'export const a = 1;');
	writeFileSync(join(root, '_astro', 'style.css'), 'a{}');
	writeFileSync(join(root, 'public.js'), '');
	const clientRoot = pathToFileURL(root + '/');
	const clientFiles = ['_astro/page.js', '_astro/chunk.js', '_astro/style.css', 'public.js'];
	after(() => rmSync(root, { recursive: true, force: true }));

	function settings(config: Record<string, unknown> = {}): any {
		return { config: { base: '/', build: { assets: '_astro' }, ...config } };
	}

	it('maps every emitted script to its hash and adds the file and import map hashes', async () => {
		const result = await trackScriptIntegrity({
			settings: settings(),
			algorithm: 'SHA-256',
			clientRoot,
			clientFiles,
		});
		const chunkHash = await generateCspDigest('export const a = 1;', 'SHA-256');
		const pageHash = await generateCspDigest('import "./chunk.js";', 'SHA-256');
		assert.ok(result);
		assert.deepStrictEqual(JSON.parse(result.importMapContent), {
			integrity: { '/_astro/chunk.js': chunkHash, '/_astro/page.js': pageHash },
		});
		assert.deepStrictEqual(result.hashes, [
			chunkHash,
			pageHash,
			await generateCspDigest(result.importMapContent, 'SHA-256'),
		]);
	});

	it('keys entries by the rendered URL, with and without the adapter query string', async () => {
		const result = await trackScriptIntegrity({
			settings: settings({ base: '/docs' }),
			algorithm: 'SHA-256',
			clientRoot,
			clientFiles: ['_astro/chunk.js'],
			assetQueryString: 'dpl=123',
		});
		assert.ok(result);
		assert.deepStrictEqual(Object.keys(JSON.parse(result.importMapContent).integrity), [
			'/docs/_astro/chunk.js',
			'/docs/_astro/chunk.js?dpl=123',
		]);
	});

	it('returns undefined when there are no emitted scripts', async () => {
		const result = await trackScriptIntegrity({
			settings: settings(),
			algorithm: 'SHA-256',
			clientRoot,
			clientFiles: ['_astro/style.css', 'public.js'],
		});
		assert.equal(result, undefined);
	});
});
