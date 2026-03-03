const { defineConfig } = require('@vscode/test-cli');

module.exports = defineConfig([
	{
		label: 'unitTests',
		files: 'test/**/*.test.js',
		extensionDevelopmentPath: '../vscode',
		version: 'stable',
		mocha: {
			ui: 'tdd',
			timeout: 20000,
		},
	},
]);
