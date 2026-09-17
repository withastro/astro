import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import * as path from 'node:path';
import { pathToFileURL } from 'node:url';
import { describe, it } from 'node:test';
import ts from 'typescript';
import { getLanguageServicePlugins } from '../../dist/languageServerPlugin.js';

function pluginNames(astroContentMapperRegistered: boolean, workspacePath?: string) {
	const plugins = getLanguageServicePlugins(
		{} as any,
		ts,
		{ reload() {}, configs: [] } as any,
		{
			initializationOptions: { astroContentMapperRegistered },
			workspaceFolders: workspacePath
				? [{ name: 'test', uri: pathToFileURL(workspacePath).href }]
				: null,
		} as any,
	);

	return plugins.map((plugin) => plugin.name).filter((name): name is string => Boolean(name));
}

function workspaceWithConfig(config: object) {
	const workspacePath = mkdtempSync(path.join(tmpdir(), 'astro-content-mapper-'));
	writeFileSync(path.join(workspacePath, 'tsconfig.json'), JSON.stringify(config));
	return workspacePath;
}

function hasTypeScriptPlugins(names: string[]) {
	return names.some((name) => name.includes('typescript'));
}

describe('getLanguageServicePlugins', () => {
	it('registers TypeScript support when the extension contribution is unavailable', () => {
		assert.equal(hasTypeScriptPlugins(pluginNames(false)), true);
	});

	it('stands TypeScript support down for an inferred project', () => {
		assert.equal(hasTypeScriptPlugins(pluginNames(true)), false);
	});

	it('keeps TypeScript support for a configured project without an Astro mapper', () => {
		const workspacePath = workspaceWithConfig({ compilerOptions: { strict: true } });

		assert.equal(hasTypeScriptPlugins(pluginNames(true, workspacePath)), true);
	});

	it('stands TypeScript support down for a user-configured Astro mapper', () => {
		const workspacePath = workspaceWithConfig({
			contentMappers: [
				{ package: '@astrojs/ts-content-mapper', extensions: ['.astro'] },
			],
		});

		assert.equal(hasTypeScriptPlugins(pluginNames(true, workspacePath)), false);
	});

	it('recognizes an Astro mapper inherited from an extended config', () => {
		const workspacePath = workspaceWithConfig({ extends: './base.json' });
		writeFileSync(
			path.join(workspacePath, 'base.json'),
			JSON.stringify({
				contentMappers: [
					{ package: '@astrojs/ts-content-mapper', extensions: ['.astro'] },
				],
			}),
		);

		assert.equal(hasTypeScriptPlugins(pluginNames(true, workspacePath)), false);
	});

	it('keeps TypeScript support if any config in a mixed workspace lacks an Astro mapper', () => {
		const workspacePath = workspaceWithConfig({
			contentMappers: [
				{ package: '@astrojs/ts-content-mapper', extensions: ['.astro'] },
			],
		});
		const nestedPath = path.join(workspacePath, 'nested');
		ts.sys.createDirectory(nestedPath);
		writeFileSync(path.join(nestedPath, 'tsconfig.json'), '{}');

		assert.equal(hasTypeScriptPlugins(pluginNames(true, workspacePath)), true);
	});

	it('keeps the Astro-native plugins in both modes', () => {
		for (const registered of [false, true]) {
			const names = pluginNames(registered);

			for (const expected of ['html', 'css', 'emmet', 'prettier', 'yaml']) {
				assert.ok(
					names.some((name) => name.includes(expected)),
					`expected a ${expected} plugin with astroContentMapperRegistered=${registered} in ${names.join(', ')}`,
				);
			}
		}
	});
});
