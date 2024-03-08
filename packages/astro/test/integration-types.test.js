import assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';
import { loadFixture } from './test-utils.js';
import { readFileSync, rmSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

describe('Integration types', () => {
	/** @type {import('./test-utils').DevServer} */
	let devServer;
	/** @type {import('./test-utils').Fixture} */
	let fixture;

	const root = './fixtures/integration-types/';
	const codegenDirPath = resolve(dirname(fileURLToPath(import.meta.url)), root, './.astro/');

	before(async () => {
		rmSync(codegenDirPath, {
			recursive: true,
			force: true,
		});
		fixture = await loadFixture({ root });
		devServer = await fixture.startDevServer();
	});

	after(async () => {
		await devServer.stop();
	});

	it('codegenDir is created before integrations', async () => {
		const res = await fixture.fetch('/');

		assert.equal(res.headers.get('x-codegendir-exists'), 'true');
	});

	it('types.d.ts is correctly generated', () => {
		const content = readFileSync(join(codegenDirPath, 'types.d.ts'), 'utf-8');
		assert.equal(
			content,
			`/// <reference types="astro/client" />
/// <reference path="test.d.ts" />
/// <reference path="content.d.ts" />

export {};
`
		);
	});

	it('test.d.ts is correctly generated', () => {
		const content = readFileSync(join(codegenDirPath, 'test.d.ts'), 'utf-8');
		assert.equal(content, 'type Test = string;');
	})
});
