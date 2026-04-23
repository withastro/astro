import { defineConfig } from '@vscode/test-cli';

export default defineConfig([
	{
		label: 'unitTests',
		files: 'test/**/*.test.mts',
		extensionDevelopmentPath: '../vscode',
		version: 'stable',
		mocha: {
			ui: 'tdd',
			timeout: 20000,
			require: ['tsx'],
		},
	},
]);
