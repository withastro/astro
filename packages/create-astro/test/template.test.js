import { expect } from 'chai';

import { template } from '../dist/index.js';
import { setup } from './utils.js';

describe('template', () => {
	const fixture = setup();

	it('none', async () => {
		const context = { template: '', cwd: '', dryRun: true, prompt: () => ({ template: 'blog' }) };
		await template(context);

		expect(fixture.hasMessage('Skipping template copying')).to.be.true;
		expect(context.template).to.eq('blog');
	});

	it('minimal (--dry-run)', async () => {
		const context = { template: 'minimal', cwd: '', dryRun: true, prompt: () => {} };
		await template(context);
		expect(fixture.hasMessage('Using minimal as project template')).to.be.true;
	});

	it('basics (--dry-run)', async () => {
		const context = { template: 'basics', cwd: '', dryRun: true, prompt: () => {} };
		await template(context);

		expect(fixture.hasMessage('Using basics as project template')).to.be.true;
	});

	it('blog (--dry-run)', async () => {
		const context = { template: 'blog', cwd: '', dryRun: true, prompt: () => {} };
		await template(context);

		expect(fixture.hasMessage('Using blog as project template')).to.be.true;
	});

	it('minimal (--yes)', async () => {
		const context = { template: 'minimal', cwd: '', dryRun: true, yes: true, prompt: () => {} };
		await template(context);

		expect(fixture.hasMessage('Using minimal as project template')).to.be.true;
	});
});
