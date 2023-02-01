import { describe, test, expect } from 'vitest'
import os from 'node:os';
import { getContext } from '../src/actions/context';

describe('context', () => {
	test('no arguments', async () => {
		const ctx = await getContext([]);
		expect(ctx.projectName).toBeUndefined();
		expect(ctx.template).toBeUndefined();
		expect(ctx.skipHouston).toBe(os.platform() === 'win32');
		expect(ctx.dryRun).toBeUndefined();
	})
	test('project name', async () => {
		const ctx = await getContext(['foobar']);
		expect(ctx.projectName).toBe('foobar');
	})
	test('template', async () => {
		const ctx = await getContext(['--template', 'minimal']);
		expect(ctx.template).toBe('minimal');
	})
	test('skip houston (explicit)', async () => {
		const ctx = await getContext(['--skip-houston']);
		expect(ctx.skipHouston).toBe(true);
	})
	test('skip houston (yes)', async () => {
		const ctx = await getContext(['-y']);
		expect(ctx.skipHouston).toBe(true);
	})
	test('skip houston (no)', async () => {
		const ctx = await getContext(['-n']);
		expect(ctx.skipHouston).toBe(true);
	})
	test('skip houston (install)', async () => {
		const ctx = await getContext(['--install']);
		expect(ctx.skipHouston).toBe(true);
	})
	test('dry run', async () => {
		const ctx = await getContext(['--dry-run']);
		expect(ctx.dryRun).toBe(true);
	})
	test('install', async () => {
		const ctx = await getContext(['--install']);
		expect(ctx.install).toBe(true);
	})
	test('no install', async () => {
		const ctx = await getContext(['--no-install']);
		expect(ctx.install).toBe(false);
	})
	test('git', async () => {
		const ctx = await getContext(['--git']);
		expect(ctx.git).toBe(true);
	})
	test('no git', async () => {
		const ctx = await getContext(['--no-git']);
		expect(ctx.git).toBe(false);
	})
	test('typescript', async () => {
		const ctx = await getContext(['--typescript', 'strict']);
		expect(ctx.typescript).toBe('strict');
	})
})
