import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs/promises';
import { createRequire } from 'node:module';
import os from 'node:os';
import path from 'node:path';
import { after, before, describe, it } from 'node:test';
import { setTimeout } from 'node:timers/promises';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { startProtocolProcess } from './process.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const runtime = process.env.LANGUAGE_TOOLS_NODE ?? process.execPath;
const packages = ['yaml2ts', 'language-server', 'ts-plugin', 'astro-check'];
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
	},
	{ timeout: 300000 },
);

after(async () => {
	if (temporary) await fs.rm(temporary, { recursive: true, force: true });
});

it('loads packed public APIs through import and require without a loader', () => {
	run(`
		import assert from 'node:assert/strict';
		import { createRequire } from 'node:module';
		const require = createRequire(import.meta.url);
		for (const [name, key] of [['@astrojs/language-server', 'AstroCheck'], ['@astrojs/check', 'check'], ['@astrojs/yaml2ts', 'yaml2ts']]) {
			const esm = await import(name);
			const cjs = require(name);
			assert.equal(typeof esm[key], 'function');
			assert.equal(esm[key], cjs[key]);
		}
		const esm = await import('@astrojs/ts-plugin');
		assert.equal(typeof require('@astrojs/ts-plugin'), 'function');
		assert.equal(esm.default, require('@astrojs/ts-plugin'));
		assert.equal(typeof require('@astrojs/language-server').Diagnostic.create, 'function');
	`);
});

it('ships a working version launcher and declaration assets', async () => {
	const server = path.dirname(require.resolve('@astrojs/language-server/package.json'));
	const manifest = JSON.parse(await fs.readFile(path.join(server, 'package.json'), 'utf8'));
	assert.equal(
		execFileSync(runtime, [path.join(server, 'bin/nodeServer.js'), '--version'], {
			env,
			encoding: 'utf8',
			timeout: 10000,
		}).trim(),
		manifest.version,
	);
	for (const file of ['astro-jsx.d.ts', 'jsx-runtime-fallback.d.ts', 'jsx-runtime-augment.d.ts']) {
		await fs.access(path.join(server, 'types', file));
	}
});

for (const bundled of [false, true]) {
	describe(bundled ? 'extension bundles' : 'packed npm packages', () => {
		for (const mode of ['global', 'tsconfig']) {
			it(`loads the plugin in TS Server (${mode}) and finds Astro references`, {
				timeout: 60000,
			}, async (t) => {
				const project = path.join(consumer, `plugin-${bundled}-${mode}`);
				await fs.mkdir(project);
				const name = bundled ? 'astro-ts-plugin-bundle' : '@astrojs/ts-plugin';
				const probe = bundled ? path.join(root, 'vscode') : consumer;
				await fs.writeFile(
					path.join(project, 'tsconfig.json'),
					JSON.stringify({
						compilerOptions: {
							jsx: 'preserve',
							plugins: mode === 'tsconfig' ? [{ name }] : undefined,
						},
					}),
				);
				for (const file of ['script.ts', 'MyAstroComponent.astro']) {
					await fs.copyFile(
						path.join(root, 'ts-plugin/test/fixtures', file),
						path.join(project, file),
					);
				}
				if (bundled) {
					await fs.mkdir(path.join(project, 'node_modules'));
					await fs.symlink(
						path.join(root, 'vscode/node_modules/astro-ts-plugin-bundle'),
						path.join(project, 'node_modules', name),
						'junction',
					);
				}
				const args = [
					require.resolve('typescript/lib/tsserver.js'),
					'--disableAutomaticTypingAcquisition',
				];
				if (mode === 'global') args.push('--globalPlugins', name, '--pluginProbeLocations', probe);
				else args.push('--allowLocalPluginLoads');
				const server = startProtocolProcess(t, args, project, 'tsserver');
				const file = path.join(project, 'script.ts');
				const lines = (await fs.readFile(file, 'utf8')).split('\n');
				const line = lines.findIndex((text) => text.includes('class Hello')) + 1;
				const offset = lines[line - 1].indexOf('Hello') + 1;
				await server.request('open', { file, projectRootPath: project });
				let references = [];
				for (let attempt = 0; attempt < 30; attempt++) {
					references = (await server.request('references', { file, line, offset }))?.refs ?? [];
					if (references.some((ref) => ref.file.endsWith('MyAstroComponent.astro'))) break;
					await setTimeout(200);
				}
				assert.ok(
					references.some((ref) => ref.file.endsWith('MyAstroComponent.astro')),
					JSON.stringify(references),
				);
			});
		}

		it('starts the language server over stdio and diagnoses an Astro document', {
			timeout: 60000,
		}, async (t) => {
			const project = path.join(consumer, `server-${bundled}`);
			await fs.mkdir(project);
			await fs.writeFile(
				path.join(project, 'tsconfig.json'),
				JSON.stringify({ compilerOptions: { jsx: 'preserve', strict: true } }),
			);
			const source = "---\nconst n: number = 'oops';\n---\n<div>{n}</div>";
			const file = path.join(project, 'index.astro');
			await fs.writeFile(file, source);
			const entry = bundled
				? path.join(root, 'vscode/dist/node/server.js')
				: require.resolve('@astrojs/language-server/bin/nodeServer.js');
			const server = startProtocolProcess(t, [entry, '--stdio'], project, 'lsp');
			const folder = pathToFileURL(project).href;
			const result = await server.request('initialize', {
				processId: process.pid,
				rootUri: folder,
				workspaceFolders: [{ uri: folder, name: 'fixture' }],
				capabilities: { textDocument: { diagnostic: {} } },
				initializationOptions: {
					typescript: { tsdk: path.dirname(require.resolve('typescript/lib/typescript.js')) },
				},
			});
			assert.ok(result.capabilities.completionProvider);
			server.notify('initialized', {});
			server.notify('textDocument/didOpen', {
				textDocument: {
					uri: pathToFileURL(file).href,
					languageId: 'astro',
					version: 1,
					text: source,
				},
			});
			const diagnostics = await server.request('textDocument/diagnostic', {
				textDocument: { uri: pathToFileURL(file).href },
			});
			assert.ok(
				diagnostics.items.some((diagnostic) => diagnostic.code === 2322),
				JSON.stringify(diagnostics),
			);
			await server.request('shutdown', null);
			server.notify('exit');
		});
	});
}
