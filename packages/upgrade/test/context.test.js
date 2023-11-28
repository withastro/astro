import { expect } from 'chai';
import { getContext } from '../dist/index.js';

describe('context', () => {
	it('no arguments', async () => {
		const ctx = await getContext([]);
		expect(ctx.version).to.eq('latest');
		expect(ctx.dryRun).to.be.undefined;
	});
	it('tag', async () => {
		const ctx = await getContext(['beta']);
		expect(ctx.version).to.eq('beta');
		expect(ctx.dryRun).to.be.undefined;
	});
	it('dry run', async () => {
		const ctx = await getContext(['--dry-run']);
		expect(ctx.dryRun).to.eq(true);
	});
});
