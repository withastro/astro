import { describe, test, expect } from 'vitest'

import { template } from '../src/actions/template.js';
import { setup } from './utils.js';

describe('template', () => {
	const fixture = setup();

	test('none', async () => {
		const context = { template: '', cwd: '', dryRun: true, prompt: (() => ({ template: 'blog' })) as any };
		await template(context);

		expect(fixture.hasMessage('Skipping template copying')).toBeTruthy();
		expect(context.template).toBe('blog');
	})

	test('minimal (--dry-run)', async () => {
		const context = { template: 'minimal', cwd: '', dryRun: true, prompt: (() => {}) as any };
		await template(context);
		expect(fixture.hasMessage('Using minimal as project template')).toBeTruthy();
	})

	test('basics (--dry-run)', async () => {
		const context = { template: 'basics', cwd: '', dryRun: true, prompt: (() => {}) as any };
		await template(context);

		expect(fixture.hasMessage('Using basics as project template')).toBeTruthy();
	})

	test('blog (--dry-run)', async () => {
		const context = { template: 'blog', cwd: '', dryRun: true, prompt: (() => {}) as any };
		await template(context);

		expect(fixture.hasMessage('Using blog as project template')).toBeTruthy();
	})
})
