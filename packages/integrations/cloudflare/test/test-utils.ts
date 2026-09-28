import type { PreviewServer } from 'astro';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { glob as globFiles } from 'tinyglobby';
import {
	loadFixture as baseLoadFixture,
	type AstroInlineConfig,
	type DevServer,
	type Fixture,
} from 'astro/_internal/test/test-utils';

export type { AstroInlineConfig, DevServer, Fixture, PreviewServer };

export function getBuildOutputDirectory(root: URL, target: 'client' | 'server' | 'prerender'): URL {
	if (target === 'client') {
		return new URL('./.cloudflare/output/v0/workers/default/assets/', root);
	}
	const worker = target === 'server' ? 'default' : 'prerender';
	return new URL(`./.cloudflare/output/v0/workers/${worker}/bundle/`, root);
}

export async function loadFixture(inlineConfig: AstroInlineConfig): Promise<Fixture> {
	if (!inlineConfig?.root) throw new Error("Must provide { root: './fixtures/...' }");

	// resolve the relative root (i.e. "./fixtures/tailwindcss") to a full filepath
	// without this, the main `loadFixture` helper will resolve relative to `packages/astro/test`
	const fixture = await baseLoadFixture({
		...inlineConfig,
		root: new URL(inlineConfig.root as string, import.meta.url).toString(),
	});

	// For unknown reasons, the error below could raise during testing. We add a retry mechanism to handle it.
	// Some further investigation is needed to understand the root cause.
	//
	// Unable to build fixture for the attempt 1: Error: There is a new version of the pre-bundle for "/astro/packages/integrations/cloudflare/test/fixtures/with-svelte/node_modules/.vite/deps_ssr/svelte_server.js?v=9924cddf", a page reload is going to ask for it.
	const buildWithRetry: Fixture['build'] = async (...args) => {
		let err: unknown;
		for (let attempt = 1; attempt <= 3; attempt++) {
			try {
				return await fixture.build(...args);
			} catch (error) {
				console.error(`Unable to build fixture for the attempt ${attempt}:`, error);
				err = error;
			}
		}

		if (err) {
			throw err;
		}
	};

	const clientDir = getBuildOutputDirectory(fixture.config.root, 'client');
	const serverDir = getBuildOutputDirectory(fixture.config.root, 'server');

	function resolveBuildOutputPath(filePath: string): URL | undefined {
		const normalized = filePath.replace(/^\/+/, '');
		if (normalized === 'client' || normalized.startsWith('client/')) {
			return new URL(normalized.slice('client'.length).replace(/^\/+/g, ''), clientDir);
		}
		if (normalized === 'server' || normalized.startsWith('server/')) {
			return new URL(normalized.slice('server'.length).replace(/^\/+/g, ''), serverDir);
		}
	}

	const readFile = ((filePath: string, encoding?: BufferEncoding | null) => {
		const buildOutputPath = resolveBuildOutputPath(filePath);
		if (!buildOutputPath) {
			if (encoding === undefined) return fixture.readFile(filePath);
			if (encoding === null) return fixture.readFile(filePath, null);
			return fixture.readFile(filePath, encoding);
		}
		return fs.promises.readFile(buildOutputPath, encoding === undefined ? 'utf8' : encoding);
	}) as Fixture['readFile'];

	const glob: Fixture['glob'] = async (pattern) => {
		const normalized = pattern.replace(/^\/+/, '');
		for (const [prefix, directory] of [
			['client', clientDir],
			['server', serverDir],
		] as const) {
			if (normalized.startsWith(`${prefix}/`)) {
				const matches = await globFiles(normalized.slice(prefix.length + 1), {
					cwd: fileURLToPath(directory),
					expandDirectories: false,
				});
				return matches.map((match) => `${prefix}/${match}`);
			}
		}
		return fixture.glob(pattern);
	};

	return {
		...fixture,
		build: buildWithRetry,
		pathExists: (filePath) => {
			const buildOutputPath = resolveBuildOutputPath(filePath);
			return buildOutputPath ? fs.existsSync(buildOutputPath) : fixture.pathExists(filePath);
		},
		readFile,
		readBuffer: (filePath) => {
			const buildOutputPath = resolveBuildOutputPath(filePath);
			return buildOutputPath ? fs.promises.readFile(buildOutputPath) : fixture.readBuffer(filePath);
		},
		readdir: (filePath) => {
			const buildOutputPath = resolveBuildOutputPath(filePath);
			return buildOutputPath ? fs.promises.readdir(buildOutputPath) : fixture.readdir(filePath);
		},
		glob,
		clean: async () => {
			await fixture.clean();
			await fs.promises.rm(new URL('./.cloudflare/output/', fixture.config.root), {
				recursive: true,
				force: true,
			});
		},
	};
}
