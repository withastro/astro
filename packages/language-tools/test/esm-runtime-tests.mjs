import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { describe, it } from 'node:test';
import { setTimeout } from 'node:timers/promises';
import { pathToFileURL } from 'node:url';
import { startProtocolProcess } from './process.mjs';

export function registerRuntimeTests(context) {
	for (const bundled of [false, true]) {
		describe(bundled ? 'extension bundles' : 'packed npm packages', () => {
			for (const mode of ['global', 'tsconfig']) {
				it(`loads the plugin in TS Server (${mode}) and finds Astro references`, {
					timeout: 60000,
				}, async (t) => {
					const project = path.join(context.consumer, `plugin-${bundled}-${mode}`);
					await fs.mkdir(project);
					const name = bundled ? 'astro-ts-plugin-bundle' : '@astrojs/ts-plugin';
					const probe = bundled ? context.extension : context.consumer;
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
							path.join(context.root, 'ts-plugin/test/fixtures', file),
							path.join(project, file),
						);
					}
					if (bundled) {
						await fs.mkdir(path.join(project, 'node_modules'));
						await fs.symlink(
							path.join(context.extension, 'node_modules/astro-ts-plugin-bundle'),
							path.join(project, 'node_modules', name),
							'junction',
						);
					}
					const args = [
						context.require.resolve('typescript/lib/tsserver.js'),
						'--disableAutomaticTypingAcquisition',
					];
					if (mode === 'global')
						args.push('--globalPlugins', name, '--pluginProbeLocations', probe);
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
				const project = path.join(context.consumer, `server-${bundled}`);
				await fs.mkdir(project);
				await fs.writeFile(
					path.join(project, 'tsconfig.json'),
					JSON.stringify({ compilerOptions: { jsx: 'preserve', strict: true } }),
				);
				const source = "---\nconst n: number = 'oops';\n---\n<div>{n}</div>";
				const file = path.join(project, 'index.astro');
				await fs.writeFile(file, source);
				const entry = bundled
					? path.join(context.extension, 'dist/node/server.js')
					: context.require.resolve('@astrojs/language-server/bin/nodeServer.js');
				const server = startProtocolProcess(t, [entry, '--stdio'], project, 'lsp');
				const folder = pathToFileURL(project).href;
				const result = await server.request('initialize', {
					processId: process.pid,
					rootUri: folder,
					workspaceFolders: [{ uri: folder, name: 'fixture' }],
					capabilities: { textDocument: { diagnostic: {} } },
					initializationOptions: {
						typescript: {
							tsdk: path.dirname(context.require.resolve('typescript/lib/typescript.js')),
						},
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
}
