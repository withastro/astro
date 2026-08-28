import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import ts from 'typescript';
import { getLanguageServicePlugins } from '../../dist/languageServerPlugin.js';

function pluginNames(contentMapperEnabled: boolean) {
	const plugins = getLanguageServicePlugins(
		{} as any,
		ts,
		{ reload() {}, configs: [] } as any,
		{ initializationOptions: { contentMapperEnabled } } as any,
	);

	return plugins.map((plugin) => plugin.name).filter((name): name is string => Boolean(name));
}

describe('getLanguageServicePlugins', () => {
	it('registers TypeScript support by default', () => {
		const names = pluginNames(false);

		assert.ok(
			names.some((name) => name.includes('typescript')),
			`expected a typescript plugin in ${names.join(', ')}`,
		);
	});

	it('stands TypeScript support down when a content mapper owns it', () => {
		const names = pluginNames(true);

		assert.equal(
			names.filter((name) => name.includes('typescript')).length,
			0,
			`expected no typescript plugins in ${names.join(', ')}`,
		);
	});

	it('keeps the Astro-native plugins in both modes', () => {
		for (const enabled of [false, true]) {
			const names = pluginNames(enabled);

			for (const expected of ['html', 'css', 'emmet', 'prettier', 'yaml']) {
				assert.ok(
					names.some((name) => name.includes(expected)),
					`expected a ${expected} plugin with contentMapperEnabled=${enabled} in ${names.join(', ')}`,
				);
			}
		}
	});
});
