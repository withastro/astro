import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs/promises';
import { createRequire } from 'node:module';
import os from 'node:os';
import path from 'node:path';
import { after, before } from 'node:test';
import { fileURLToPath } from 'node:url';
import { packageExtension } from './package-extension.mjs';
import { registerPackageTests } from './esm-package-tests.mjs';
import { registerRuntimeTests } from './esm-runtime-tests.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const runtime = process.env.LANGUAGE_TOOLS_NODE ?? process.execPath;
const packages = ['yaml2ts', 'language-server', 'ts-plugin', 'astro-check'];
let extension = path.join(root, 'vscode');
let temporary;
let consumer;
let require;
const env = { ...process.env };
delete env.NODE_OPTIONS;
delete env.NODE_PATH;

function run(code) {
	return execFileSync(runtime, ['--input-type=module', '-e', code], {
		cwd: consumer,
		env,
		encoding: 'utf8',
		timeout: 30000,
	});
}

before(
	async () => {
		temporary = await fs.mkdtemp(path.join(os.tmpdir(), 'astro-esm-'));
		consumer = path.join(temporary, 'consumer with spaces 日本語');
		await fs.mkdir(consumer);
		const cli = process.env.npm_execpath;
		assert.ok(cli, 'Run this suite through pnpm');
		const dependencies = { typescript: '6.0.3' };
		for (const directory of packages) {
			const cwd = path.join(root, directory);
			const manifest = JSON.parse(await fs.readFile(path.join(cwd, 'package.json'), 'utf8'));
			execFileSync(process.execPath, [cli, 'pack', '--pack-destination', temporary], {
				cwd,
				env,
				stdio: 'pipe',
				timeout: 60000,
			});
			const tarball = `${manifest.name.replace('@', '').replace('/', '-')}-${manifest.version}.tgz`;
			dependencies[manifest.name] = `file:${path.join(temporary, tarball)}`;
		}
		await fs.writeFile(
			path.join(consumer, 'package.json'),
			JSON.stringify({ private: true, type: 'module', dependencies }),
		);
		execFileSync(
			process.execPath,
			[cli, 'install', '--ignore-workspace', '--ignore-scripts', '--no-frozen-lockfile'],
			{
				cwd: consumer,
				env,
				stdio: 'pipe',
				timeout: 180000,
			},
		);
		require = createRequire(path.join(consumer, 'package.json'));
		if (process.env.LANGUAGE_TOOLS_PACKAGE_EXTENSION)
			extension = await packageExtension(extension, temporary);
	},
	{ timeout: 600000 },
);

after(async () => {
	if (temporary) await fs.rm(temporary, { recursive: true, force: true });
});

const context = {
	root,
	runtime,
	env,
	run,
	get consumer() {
		return consumer;
	},
	get extension() {
		return extension;
	},
	get require() {
		return require;
	},
};

registerPackageTests(context);
registerRuntimeTests(context);
