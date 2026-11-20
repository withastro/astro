import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { afterEach, beforeEach, describe, it } from 'node:test';
import { pathToFileURL } from 'node:url';
import { addToGitignore } from '../../../dist/cli/add/index.js';
import { SpyLogger, createFixture } from '../test-utils.ts';
import type { Flags } from '../../../dist/cli/flags.d.ts';

describe('CLI add', () => {
	describe('addToGitignore()', () => {
		// Bypass the interactive prompt in all tests
		const YES_FLAGS = { yes: true } as Partial<Flags> as Flags;

		const logger = new SpyLogger();
		let fixture: Awaited<ReturnType<typeof createFixture>>;
		let root: URL;

		beforeEach(async () => {
			fixture = await createFixture({});
			root = pathToFileURL(fixture.path + '/');
		});

		afterEach(async () => {
			await fixture.rm();
		});

		it('creates .gitignore with entries when it does not exist', async () => {
			await addToGitignore({ root, entries: ['.vercel'], flags: YES_FLAGS, logger });

			const content = await fs.readFile(new URL('.gitignore', root), 'utf-8');
			assert.equal(content, '.vercel\n');
		});

		it('creates .gitignore with multiple entries when it does not exist', async () => {
			await addToGitignore({
				root,
				entries: ['.wrangler', 'worker-configuration.d.ts'],
				flags: YES_FLAGS,
				logger,
			});

			const content = await fs.readFile(new URL('.gitignore', root), 'utf-8');
			assert.ok(content.includes('.wrangler'));
			assert.ok(content.includes('worker-configuration.d.ts'));
		});

		it('does not create .gitignore when all entries are already present', async () => {
			fixture = await createFixture({ '.gitignore': '.vercel\n' });
			root = pathToFileURL(fixture.path + '/');

			await addToGitignore({ root, entries: ['.vercel'], flags: YES_FLAGS, logger });

			const content = await fs.readFile(new URL('.gitignore', root), 'utf-8');
			assert.equal(content, '.vercel\n');
		});

		it('still creates entries when similar entries exist', async () => {
			fixture = await createFixture({ '.gitignore': '.worker-configuration.d.ts.bak\n' });
			root = pathToFileURL(fixture.path + '/');

			await addToGitignore({
				root,
				entries: ['.worker-configuration.d.ts'],
				flags: YES_FLAGS,
				logger,
			});

			const content = await fs.readFile(new URL('.gitignore', root), 'utf-8');
			assert.equal(content, '.worker-configuration.d.ts.bak\n\n.worker-configuration.d.ts\n');
		});

		it('appends missing entries to an existing .gitignore', async () => {
			fixture = await createFixture({ '.gitignore': 'node_modules\n' });
			root = pathToFileURL(fixture.path + '/');

			await addToGitignore({ root, entries: ['.vercel'], flags: YES_FLAGS, logger });

			const content = await fs.readFile(new URL('.gitignore', root), 'utf-8');
			assert.ok(content.includes('node_modules'));
			assert.ok(content.includes('.vercel'));
		});

		it('only appends entries not already in .gitignore', async () => {
			fixture = await createFixture({ '.gitignore': '.wrangler\n' });
			root = pathToFileURL(fixture.path + '/');

			await addToGitignore({
				root,
				entries: ['.wrangler', 'worker-configuration.d.ts'],
				flags: YES_FLAGS,
				logger,
			});

			const content = await fs.readFile(new URL('.gitignore', root), 'utf-8');
			// .wrangler is not duplicated
			assert.equal(content.indexOf('.wrangler'), content.lastIndexOf('.wrangler'));
			assert.ok(content.includes('worker-configuration.d.ts'));
		});

		it('does not modify .gitignore when all entries are already present', async () => {
			const original = '.wrangler\nworker-configuration.d.ts\n';
			fixture = await createFixture({ '.gitignore': original });
			root = pathToFileURL(fixture.path + '/');

			await addToGitignore({
				root,
				entries: ['.wrangler', 'worker-configuration.d.ts'],
				flags: YES_FLAGS,
				logger,
			});

			const content = await fs.readFile(new URL('.gitignore', root), 'utf-8');
			assert.equal(content, original);
		});
	});
});
