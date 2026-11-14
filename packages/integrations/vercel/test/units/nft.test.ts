import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, parse, sep } from 'node:path';
import { describe, it } from 'node:test';
import { pathToFileURL } from 'node:url';
import {
	copyDependenciesToFunction,
	findCommonAncestor,
	handleDependencyWarning,
} from '../../dist/lib/nft.js';

function createLogger() {
	const logs: Array<{ level: 'debug' | 'info' | 'warn'; message: string }> = [];
	return {
		logs,
		logger: {
			info(message: string) {
				logs.push({ level: 'info', message });
			},
			debug(message: string) {
				logs.push({ level: 'debug', message });
			},
			warn(message: string) {
				logs.push({ level: 'warn', message });
			},
		},
	};
}

describe('copyDependenciesToFunction', () => {
	it('ignores broad globs when the project root is the trace base', async () => {
		const root = await fs.mkdtemp(join(tmpdir(), 'astro-vercel-nft-'));
		try {
			const entryPath = join(root, 'entry.mjs');
			await fs.writeFile(entryPath, '');
			let ignoresRootGlob = false;
			let ignoresPackageGlob = false;
			let traceBase: string | undefined;

			await copyDependenciesToFunction(
				{
					entry: pathToFileURL(entryPath),
					outDir: pathToFileURL(join(root, 'out') + sep),
					includeFiles: [],
					excludeFiles: [],
					logger: createLogger().logger,
					root: pathToFileURL(root + sep),
				},
				{},
				async (_entryPoints, options) => {
					traceBase = options?.base;
					const ignore = options?.ignore;
					if (typeof ignore === 'function') {
						ignoresRootGlob = ignore('**/src/pages/index.astro');
						ignoresPackageGlob = ignore('node_modules/shared-package/data/**/*');
					}
					return {
						fileList: new Set(['entry.mjs']),
						esmFileList: new Set(),
						reasons: new Map(),
						warnings: new Set(),
					};
				},
			);

			assert.equal(traceBase, root + sep);
			assert.equal(ignoresRootGlob, true);
			assert.equal(ignoresPackageGlob, false);
		} finally {
			await fs.rm(root, { recursive: true, force: true });
		}
	});

	it('logs unrecognized dependency-resolution warnings and continues tracing', async () => {
		const root = await fs.mkdtemp(join(tmpdir(), 'astro-vercel-nft-'));
		try {
			const entryPath = join(root, 'entry.mjs');
			await fs.writeFile(entryPath, '');
			const { logs, logger } = createLogger();

			await copyDependenciesToFunction(
				{
					entry: pathToFileURL(entryPath),
					outDir: pathToFileURL(join(root, 'out') + sep),
					includeFiles: [],
					excludeFiles: [],
					logger,
					root: pathToFileURL(root + sep),
				},
				{},
				async () => ({
					fileList: new Set(['entry.mjs']),
					esmFileList: new Set(),
					reasons: new Map(),
					warnings: new Set([
						new Error('Failed to resolve dependency ENAMETOOLONG: name too long'),
					]),
				}),
			);

			assert.ok(
				logs.some(
					(log) => log.level === 'warn' && log.message.startsWith('Failed to resolve dependency'),
				),
			);
		} finally {
			await fs.rm(root, { recursive: true, force: true });
		}
	});
});

describe('handleDependencyWarning', () => {
	it('keeps logging matching missing-module warnings at debug level', () => {
		const warning = new Error(
			"Failed to resolve dependency Cannot find module 'missing-module' loaded from /project/entry.mjs",
		);
		const { logs, logger } = createLogger();

		handleDependencyWarning(warning, '/project/entry.mjs', logger);

		assert.equal(logs.length, 1);
		assert.equal(logs[0].level, 'debug');
		assert.match(logs[0].message, /missing-module/);
	});
});

describe('findCommonAncestor', () => {
	const volumeRoot = parse(process.cwd()).root;

	it('returns the root path when it contains the entry', () => {
		const root = join(volumeRoot, 'workspace', 'app');
		const entry = join(root, 'dist', 'entry.mjs');

		assert.equal(findCommonAncestor(root, entry), root);
	});

	it('returns a shared parent when the entry is outside the root', () => {
		const parent = join(volumeRoot, 'workspace');
		const root = join(parent, 'app');
		const entry = join(parent, 'dist', 'entry.mjs');

		assert.equal(findCommonAncestor(root, entry), parent);
	});

	it('stops at the filesystem root', () => {
		const root = join(volumeRoot, 'app');
		const entry = join(volumeRoot, 'dist', 'entry.mjs');

		assert.equal(findCommonAncestor(root, entry), volumeRoot);
	});
});
