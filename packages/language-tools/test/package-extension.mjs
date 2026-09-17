import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import fs from 'node:fs/promises';
import { createRequire } from 'node:module';
import path from 'node:path';
import { pipeline } from 'node:stream/promises';
import { createWriteStream } from 'node:fs';

export async function packageExtension(source, temporary) {
	const stage = path.join(temporary, 'extension-stage');
	await fs.mkdir(stage);
	for (const name of [
		'package.json',
		'README.md',
		'LICENSE',
		'.vscodeignore',
		'dist',
		'assets',
		'syntaxes',
		'languages',
	]) {
		await fs.cp(path.join(source, name), path.join(stage, name), { recursive: true });
	}
	const manifestPath = path.join(stage, 'package.json');
	const manifest = JSON.parse(await fs.readFile(manifestPath, 'utf8'));
	delete manifest.devDependencies;
	await fs.writeFile(manifestPath, JSON.stringify(manifest));
	const install = spawnSync(
		process.platform === 'win32' ? 'npm.cmd' : 'npm',
		['install', '--omit=dev', '--ignore-scripts', '--no-audit', '--no-fund', '--workspaces=false'],
		{
			cwd: stage,
			encoding: 'utf8',
			timeout: 180000,
			shell: process.platform === 'win32',
		},
	);
	assert.equal(install.status, 0, `${install.error ?? ''}\n${install.stdout}\n${install.stderr}`);
	await fs.cp(
		path.join(source, 'node_modules/astro-ts-plugin-bundle'),
		path.join(stage, 'node_modules/astro-ts-plugin-bundle'),
		{ recursive: true },
	);
	const require = createRequire(path.join(source, 'package.json'));
	const vsceManifest = require.resolve('@vscode/vsce/package.json');
	const archive = path.join(temporary, 'astro.vsix');
	execFileSync(
		process.execPath,
		[path.join(path.dirname(vsceManifest), 'vsce'), 'package', '--out', archive],
		{
			cwd: stage,
			stdio: 'pipe',
			timeout: 60000,
		},
	);
	const yauzl = createRequire(vsceManifest)('yauzl');
	const extracted = path.join(temporary, 'vsix');
	await new Promise((resolve, reject) => {
		yauzl.open(archive, { lazyEntries: true }, (error, zip) => {
			if (error) {
				reject(error);
				return;
			}
			zip.on('error', reject);
			zip.on('end', resolve);
			zip.on('entry', async (entry) => {
				try {
					if (!entry.fileName.startsWith('extension/') || entry.fileName.endsWith('/')) {
						zip.readEntry();
						return;
					}
					const file = path.resolve(extracted, entry.fileName);
					assert.ok(file.startsWith(extracted + path.sep));
					await fs.mkdir(path.dirname(file), { recursive: true });
					const stream = await new Promise((res, rej) =>
						zip.openReadStream(entry, (err, value) => (err ? rej(err) : res(value))),
					);
					await pipeline(stream, createWriteStream(file));
					zip.readEntry();
				} catch (err) {
					zip.close();
					reject(err);
				}
			});
			zip.readEntry();
		});
	});
	const extension = path.join(extracted, 'extension');
	for (const file of [
		'dist/node/client.js',
		'dist/node/server.js',
		'dist/types/astro-jsx.d.ts',
		'dist/types/jsx-runtime-fallback.d.ts',
		'dist/types/jsx-runtime-augment.d.ts',
		'node_modules/astro-ts-plugin-bundle/package.json',
		'node_modules/astro-ts-plugin-bundle/index.js',
		'node_modules/@astrojs/compiler/dist/astro.wasm',
	]) {
		await fs.access(path.join(extension, file));
	}
	return extension;
}
