import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import os from 'node:os';
import { getContext } from '../dist/index.js';
describe('context', () => {
	it('no arguments', async () => {
		const ctx = await getContext([]);
		assert.ok(!ctx.projectName);
		assert.ok(!ctx.template);
		assert.deepStrictEqual(ctx.skipHouston, os.platform() === 'win32');
		assert.ok(!ctx.dryRun);
	});

	it('project name', async () => {
		const ctx = await getContext(['foobar']);
		assert.deepStrictEqual(ctx.projectName, 'foobar');
	});

	it('template', async () => {
		const ctx = await getContext(['--template', 'minimal']);
		assert.deepStrictEqual(ctx.template, 'minimal');
	});

	it('skip houston (explicit)', async () => {
		const ctx = await getContext(['--skip-houston']);
		assert.deepStrictEqual(ctx.skipHouston, true);
	});

	it('skip houston (yes)', async () => {
		const ctx = await getContext(['-y']);
		assert.deepStrictEqual(ctx.skipHouston, true);
	});

	it('skip houston (no)', async () => {
		const ctx = await getContext(['-n']);
		assert.deepStrictEqual(ctx.skipHouston, true);
	});

	it('skip houston (install)', async () => {
		const ctx = await getContext(['--install']);
		assert.deepStrictEqual(ctx.skipHouston, true);
	});

	it('dry run', async () => {
		const ctx = await getContext(['--dry-run']);
		assert.deepStrictEqual(ctx.dryRun, true);
	});

	it('install', async () => {
		const ctx = await getContext(['--install']);
		assert.deepStrictEqual(ctx.install, true);
	});

	it('no install', async () => {
		const ctx = await getContext(['--no-install']);
		assert.deepStrictEqual(ctx.install, false);
	});

	it('git', async () => {
		const ctx = await getContext(['--git']);
		assert.deepStrictEqual(ctx.git, true);
	});

	it('no git', async () => {
		const ctx = await getContext(['--no-git']);
		assert.deepStrictEqual(ctx.git, false);
	});

	it('typescript', async () => {
		const ctx = await getContext(['--typescript', 'strict']);
		assert.deepStrictEqual(ctx.typescript, 'strict');
	});
});
