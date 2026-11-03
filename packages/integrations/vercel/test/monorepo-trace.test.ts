import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { before, describe, it } from 'node:test';
import { globSync } from 'tinyglobby';
import { type Fixture, loadFixture } from './test-utils.ts';

describe('NFT tracing in a monorepo', () => {
	let fixture: Fixture;
	let functionFiles: string[];

	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/monorepo-trace/apps/app/',
		});
		await fixture.build();
		functionFiles = globSync('**/*', {
			cwd: fileURLToPath(new URL('.vercel/output/functions/_render.func/', fixture.config.root)),
		});
	});

	it('traces the server entry and its chunks', () => {
		assert.ok(
			functionFiles.some((file) => file.endsWith('entry.mjs')),
			'the server entry should be traced',
		);
		assert.ok(
			functionFiles.some((file) => file.includes('chunks/') && file.endsWith('.mjs')),
			'imported chunks should be traced',
		);
	});

	it('traces files resolved from the runtime cwd', () => {
		assert.ok(
			functionFiles.some((file) => file.endsWith('asset.txt')),
			'the function should include files resolved from process.cwd()',
		);
	});

	it('does not trace unrelated workspace files', () => {
		assert.equal(
			functionFiles.some((file) => file.includes('hero-image')),
			false,
			'the function should not include the decoy outside the app',
		);
		assert.equal(
			functionFiles.some((file) => file.includes('static/public')),
			false,
			'the function should not glob the workspace root',
		);
	});
});
