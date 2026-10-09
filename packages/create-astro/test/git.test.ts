import assert from 'node:assert/strict';
import { rmSync } from 'node:fs';
import { mkdir, writeFile } from 'node:fs/promises';
import { after, before, describe, it } from 'node:test';

import { git } from '../dist/index.js';
import { type GitContext, mockPrompt, setup } from './test-utils.ts';

describe('git', () => {
	const fixture = setup();

	it('none', async () => {
		const context: GitContext = {
			cwd: '',
			dryRun: true,
			prompt: mockPrompt({ git: false }),
			tasks: [],
		};
		await git(context);

		assert.ok(fixture.hasMessage('Skipping Git initialization'));
	});

	it('yes (--dry-run)', async () => {
		const context: GitContext = {
			cwd: '',
			dryRun: true,
			prompt: mockPrompt({ git: true }),
			tasks: [],
		};
		await git(context);
		assert.ok(fixture.hasMessage('Skipping Git initialization'));
	});

	it('no (--dry-run)', async () => {
		const context: GitContext = {
			cwd: '',
			dryRun: true,
			prompt: mockPrompt({ git: false }),
			tasks: [],
		};
		await git(context);

		assert.ok(fixture.hasMessage('Skipping Git initialization'));
	});
});

describe('git initialized', () => {
	const fixture = setup();
	const dir = new URL(new URL('./fixtures/not-empty/.git', import.meta.url));

	before(async () => {
		await mkdir(dir, { recursive: true });
		await writeFile(new URL('./git.json', dir), '{}', { encoding: 'utf8' });
	});

	it('already initialized', async () => {
		const context: GitContext = {
			git: true,
			cwd: './test/fixtures/not-empty',
			dryRun: false,
			prompt: mockPrompt({ git: false }),
			tasks: [],
		};
		await git(context);

		assert.ok(fixture.hasMessage('Git has already been initialized'));
	});

	after(() => {
		rmSync(dir, { recursive: true, force: true });
	});
});
