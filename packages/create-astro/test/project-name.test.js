import { expect } from 'chai';

import { projectName } from '../dist/index.js';
import { setup } from './utils.js';

describe('project name', () => {
	const fixture = setup();

	it('pass in name', async () => {
		const context = { projectName: '', cwd: './foo/bar/baz', prompt: () => {} };
		await projectName(context);

		expect(context.cwd).to.eq('./foo/bar/baz');
		expect(context.projectName).to.eq('baz');
	});

	it('dot', async () => {
		const context = { projectName: '', cwd: '.', prompt: () => ({ name: 'foobar' }) };
		await projectName(context);

		expect(fixture.hasMessage('"." is not empty!')).to.be.true;
		expect(context.projectName).to.eq('foobar');
	});

	it('dot slash', async () => {
		const context = { projectName: '', cwd: './', prompt: () => ({ name: 'foobar' }) };
		await projectName(context);

		expect(fixture.hasMessage('"./" is not empty!')).to.be.true;
		expect(context.projectName).to.eq('foobar');
	});

	it('empty', async () => {
		const context = {
			projectName: '',
			cwd: './test/fixtures/empty',
			prompt: () => ({ name: 'foobar' }),
		};
		await projectName(context);

		expect(fixture.hasMessage('"./test/fixtures/empty" is not empty!')).to.be.false;
		expect(context.projectName).to.eq('empty');
	});

	it('not empty', async () => {
		const context = {
			projectName: '',
			cwd: './test/fixtures/not-empty',
			prompt: () => ({ name: 'foobar' }),
		};
		await projectName(context);

		expect(fixture.hasMessage('"./test/fixtures/not-empty" is not empty!')).to.be.true;
		expect(context.projectName).to.eq('foobar');
	});

	it('basic', async () => {
		const context = { projectName: '', cwd: '', prompt: () => ({ name: 'foobar' }) };
		await projectName(context);

		expect(context.cwd).to.eq('foobar');
		expect(context.projectName).to.eq('foobar');
	});

	it('blank space', async () => {
		const context = { projectName: '', cwd: '', prompt: () => ({ name: 'foobar  ' }) };
		await projectName(context);

		expect(context.cwd).to.eq('foobar');
		expect(context.projectName).to.eq('foobar');
	});

	it('normalize', async () => {
		const context = { projectName: '', cwd: '', prompt: () => ({ name: 'Invalid Name' }) };
		await projectName(context);

		expect(context.cwd).to.eq('Invalid Name');
		expect(context.projectName).to.eq('invalid-name');
	});

	it('remove leading/trailing dashes', async () => {
		const context = { projectName: '', cwd: '', prompt: () => ({ name: '(invalid)' }) };
		await projectName(context);

		expect(context.projectName).to.eq('invalid');
	});

	it('handles scoped packages', async () => {
		const context = { projectName: '', cwd: '', prompt: () => ({ name: '@astro/site' }) };
		await projectName(context);

		expect(context.cwd).to.eq('@astro/site');
		expect(context.projectName).to.eq('@astro/site');
	});

	it('--yes', async () => {
		const context = {
			projectName: '',
			cwd: './foo/bar/baz',
			yes: true,
			prompt: () => {},
		};
		await projectName(context);
		expect(context.projectName).to.eq('baz');
	});

	it('dry run with name', async () => {
		const context = {
			projectName: '',
			cwd: './foo/bar/baz',
			dryRun: true,
			prompt: () => {},
		};
		await projectName(context);
		expect(context.projectName).to.eq('baz');
	});

	it('dry run with dot', async () => {
		const context = {
			projectName: '',
			cwd: '.',
			dryRun: true,
			prompt: () => ({ name: 'foobar' }),
		};
		await projectName(context);
		expect(context.projectName).to.eq('foobar');
	});

	it('dry run with empty', async () => {
		const context = {
			projectName: '',
			cwd: './test/fixtures/empty',
			dryRun: true,
			prompt: () => ({ name: 'foobar' }),
		};
		await projectName(context);
		expect(context.projectName).to.eq('empty');
	});
});
