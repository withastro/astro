import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { afterEach, beforeEach, describe, it } from 'node:test';
import { pathToFileURL } from 'node:url';
import { addToGitignore } from '../../../dist/cli/add/index.js';
import { TinyexecCommandExecutor } from '../../../dist/cli/infra/tinyexec-command-executor.js';
import { SpyLogger, createFixture } from '../test-utils.ts';
import type { Flags } from '../../../dist/cli/flags.d.ts';

describe('CLI add', () => {
	describe('addToGitignore()', () => {
		// Bypass the interactive prompt in all tests
		const YES_FLAGS = { yes: true } as Partial<Flags> as Flags;

		const logger = new SpyLogger();
		const commandExecutor = new TinyexecCommandExecutor();
		let fixture: Awaited<ReturnType<typeof createFixture>>;
		let root: URL;
		let commonArgs: Omit<Parameters<typeof addToGitignore>[0], 'entries'>;

		async function setFixture(tree: Parameters<typeof createFixture>[0]) {
			if (fixture) await fixture.rm();
			fixture = await createFixture(tree);
			root = pathToFileURL(fixture.path + '/');
			commonArgs = { root, flags: YES_FLAGS, logger, commandExecutor };
			await commandExecutor.execute('git', ['init'], { cwd: fixture.path, stdio: 'ignore' });
		}

		beforeEach(async () => {
			await setFixture({});
		});

		afterEach(async () => {
			await fixture.rm();
		});

		it('creates .gitignore with entries when it does not exist', async () => {
			await addToGitignore({ ...commonArgs, entries: [{ type: 'folder', path: '.vercel' }] });

			const content = await fs.readFile(new URL('.gitignore', root), 'utf-8');
			assert.equal(content, '.vercel\n');
		});

		it('creates .gitignore with multiple entries when it does not exist', async () => {
			await addToGitignore({
				...commonArgs,
				entries: [
					{ type: 'folder', path: '.wrangler' },
					{ type: 'file', path: 'worker-configuration.d.ts' },
				],
			});

			const content = await fs.readFile(new URL('.gitignore', root), 'utf-8');
			assert.ok(content.includes('.wrangler'));
			assert.ok(content.includes('worker-configuration.d.ts'));
		});

		it('does not create .gitignore when all entries are already present', async () => {
			await setFixture({ '.gitignore': '.vercel\n' });

			await addToGitignore({ ...commonArgs, entries: [{ type: 'folder', path: '.vercel' }] });

			const content = await fs.readFile(new URL('.gitignore', root), 'utf-8');
			assert.equal(content, '.vercel\n');
		});

		it('still creates entries when similar entries exist', async () => {
			await setFixture({ '.gitignore': '.worker-configuration.d.ts.bak\n' });

			await addToGitignore({
				...commonArgs,
				entries: [{ type: 'file', path: '.worker-configuration.d.ts' }],
			});

			const content = await fs.readFile(new URL('.gitignore', root), 'utf-8');
			assert.equal(content, '.worker-configuration.d.ts.bak\n\n.worker-configuration.d.ts\n');
		});

		it('appends missing entries to an existing .gitignore', async () => {
			await setFixture({ '.gitignore': 'node_modules\n' });

			await addToGitignore({ ...commonArgs, entries: [{ type: 'folder', path: '.vercel' }] });

			const content = await fs.readFile(new URL('.gitignore', root), 'utf-8');
			assert.ok(content.includes('node_modules'));
			assert.ok(content.includes('.vercel'));
		});

		it('only appends entries not already in .gitignore', async () => {
			await setFixture({ '.gitignore': '.wrangler\n' });

			await addToGitignore({
				...commonArgs,
				entries: [
					{ type: 'folder', path: '.wrangler' },
					{ type: 'file', path: 'worker-configuration.d.ts' },
				],
			});

			const content = await fs.readFile(new URL('.gitignore', root), 'utf-8');
			// .wrangler is not duplicated
			assert.equal(content.indexOf('.wrangler'), content.lastIndexOf('.wrangler'));
			assert.ok(content.includes('worker-configuration.d.ts'));
		});

		it('does not modify .gitignore when all entries are already present', async () => {
			const original = '.wrangler\nworker-configuration.d.ts\n';
			await setFixture({ '.gitignore': original });

			await addToGitignore({
				...commonArgs,
				entries: [
					{ type: 'folder', path: '.wrangler' },
					{ type: 'file', path: 'worker-configuration.d.ts' },
				],
			});

			const content = await fs.readFile(new URL('.gitignore', root), 'utf-8');
			assert.equal(content, original);
		});

		it('preserves a negated file under an ignored adapter directory', async () => {
			const original = '.vercel/*\n!.vercel/project.json\n';
			await setFixture({ '.gitignore': original });

			await addToGitignore({ ...commonArgs, entries: [{ type: 'folder', path: '.vercel' }] });

			const content = await fs.readFile(new URL('.gitignore', root), 'utf-8');
			assert.equal(content, original);
		});

		it('does not treat a leading space as an existing ignore rule', async () => {
			await setFixture({ '.gitignore': ' .netlify\n' });

			await addToGitignore({ ...commonArgs, entries: [{ type: 'folder', path: '.netlify' }] });

			const content = await fs.readFile(new URL('.gitignore', root), 'utf-8');
			assert.equal(content, ' .netlify\n\n.netlify\n');
		});
	});
});
