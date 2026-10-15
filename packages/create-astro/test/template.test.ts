import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { template } from '../dist/index.js';
import { mockExit, mockPrompt, setup, type TemplateContext } from './test-utils.ts';

describe('template', async () => {
	const fixture = setup();

	it('none', async () => {
		const context: TemplateContext = {
			template: '',
			dryRun: true,
			prompt: mockPrompt({ template: 'blog' }),
			exit: mockExit,
			tasks: [],
		};
		await template(context);
		assert.ok(fixture.hasMessage('Skipping template copying'));
		assert.equal(context.template, 'blog');
	});

	it('minimal (--dry-run)', async () => {
		const context: TemplateContext = {
			template: 'minimal',
			dryRun: true,
			prompt: mockPrompt({}),
			exit: mockExit,
			tasks: [],
		};
		await template(context);
		assert.ok(fixture.hasMessage('Using minimal as project template'));
	});

	it('basics (--dry-run)', async () => {
		const context: TemplateContext = {
			template: 'basics',
			dryRun: true,
			prompt: mockPrompt({}),
			exit: mockExit,
			tasks: [],
		};
		await template(context);
		assert.ok(fixture.hasMessage('Using basics as project template'));
	});

	it('blog (--dry-run)', async () => {
		const context: TemplateContext = {
			template: 'blog',
			dryRun: true,
			prompt: mockPrompt({}),
			exit: mockExit,
			tasks: [],
		};
		await template(context);
		assert.ok(fixture.hasMessage('Using blog as project template'));
	});

	it('minimal (--yes)', async () => {
		const context: TemplateContext = {
			template: 'minimal',
			dryRun: true,
			yes: true,
			prompt: mockPrompt({}),
			exit: mockExit,
			tasks: [],
		};
		await template(context);
		assert.ok(fixture.hasMessage('Using minimal as project template'));
	});
});
