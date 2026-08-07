import { defineConfig } from '@vscode/test-cli';

export default defineConfig([
	{
		label: 'unitTests',
		files: 'test/**/*.test.mts',
		// Pinned: VS Code 1.132 ships a broken macOS arm64 build whose Electron binary
		// fails to spawn (ENOENT), breaking these tests on Apple Silicon runners.
		version: '1.131.0',
		mocha: {
			ui: 'tdd',
			timeout: 20000,
			require: ['tsx'],
		},
	},
]);
