import * as assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { createVite } from '../../../dist/core/create-vite.js';
import { createBasicSettings, defaultLogger } from '../test-utils.ts';

type GenerateScopedName = (name: string, filename: string, css: string) => string;

describe('CSS module scoped name in dev', () => {
	it('provides a stable generateScopedName in dev mode', async () => {
		const settings = await createBasicSettings();
		const routesList = { routes: [] };
		const config = await createVite(
			{},
			{
				settings,
				logger: defaultLogger,
				mode: 'development',
				command: 'dev',
				routesList,
				sync: false,
			},
		);

		const generateScopedName = config.css?.modules
			? (config.css.modules as { generateScopedName?: GenerateScopedName }).generateScopedName
			: undefined;

		assert.ok(
			typeof generateScopedName === 'function',
			'dev config should have generateScopedName',
		);

		// Same file + class name should produce the same result regardless of CSS content
		const name1 = generateScopedName('card', '/src/Card.module.css', '.card { color: red; }');
		const name2 = generateScopedName('card', '/src/Card.module.css', '.card { color: blue; }');
		assert.equal(name1, name2, 'class name should be stable across CSS content changes');

		// Different files should produce different names for the same class
		const nameA = generateScopedName('card', '/src/A.module.css', '.card { color: red; }');
		const nameB = generateScopedName('card', '/src/B.module.css', '.card { color: red; }');
		assert.notEqual(nameA, nameB, 'different files should produce different class names');

		// Different class names in the same file should produce different names
		const nameCard = generateScopedName('card', '/src/Card.module.css', '');
		const nameTitle = generateScopedName('title', '/src/Card.module.css', '');
		assert.notEqual(
			nameCard,
			nameTitle,
			'different classes in the same file should produce different names',
		);

		// Name should include the local class name for debuggability
		assert.ok(name1.includes('card'), 'generated name should include the local class name');
	});

	it('does not set generateScopedName in build mode', async () => {
		const settings = await createBasicSettings();
		const routesList = { routes: [] };
		const config = await createVite(
			{},
			{
				settings,
				logger: defaultLogger,
				mode: 'production',
				command: 'build',
				routesList,
				sync: false,
			},
		);

		const modules = config.css?.modules;
		const generateScopedName = modules
			? (modules as { generateScopedName?: GenerateScopedName }).generateScopedName
			: undefined;

		assert.equal(
			generateScopedName,
			undefined,
			'build config should not override generateScopedName',
		);
	});
});
