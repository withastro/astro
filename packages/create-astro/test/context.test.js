import { expect } from 'chai';

import os from 'node:os';
import { getContext } from '../dist/index.js';

describe('context', () => {
	it('no arguments', async () => {
		const ctx = await getContext([]);
		expect(ctx.projectName).to.be.undefined;
		expect(ctx.template).to.be.undefined;
		expect(ctx.skipHouston).to.eq(os.platform() === 'win32');
		expect(ctx.dryRun).to.be.undefined;
	});
	it('project name', async () => {
		const ctx = await getContext(['foobar']);
		expect(ctx.projectName).to.eq('foobar');
	});
	it('template', async () => {
		const ctx = await getContext(['--template', 'minimal']);
		expect(ctx.template).to.eq('minimal');
	});
	it('skip houston (explicit)', async () => {
		const ctx = await getContext(['--skip-houston']);
		expect(ctx.skipHouston).to.eq(true);
	});
	it('skip houston (yes)', async () => {
		const ctx = await getContext(['-y']);
		expect(ctx.skipHouston).to.eq(true);
	});
	it('skip houston (no)', async () => {
		const ctx = await getContext(['-n']);
		expect(ctx.skipHouston).to.eq(true);
	});
	it('skip houston (install)', async () => {
		const ctx = await getContext(['--install']);
		expect(ctx.skipHouston).to.eq(true);
	});
	it('dry run', async () => {
		const ctx = await getContext(['--dry-run']);
		expect(ctx.dryRun).to.eq(true);
	});
	it('install', async () => {
		const ctx = await getContext(['--install']);
		expect(ctx.install).to.eq(true);
	});
	it('no install', async () => {
		const ctx = await getContext(['--no-install']);
		expect(ctx.install).to.eq(false);
	});
	it('git', async () => {
		const ctx = await getContext(['--git']);
		expect(ctx.git).to.eq(true);
	});
	it('no git', async () => {
		const ctx = await getContext(['--no-git']);
		expect(ctx.git).to.eq(false);
	});
	it('typescript', async () => {
		const ctx = await getContext(['--typescript', 'strict']);
		expect(ctx.typescript).to.eq('strict');
	});
});
