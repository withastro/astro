import fs from 'fs/promises';
import path from 'path';
import { loadFixture as baseLoadFixture } from '../../../astro/test/test-utils.js';

// Get all test files in directory, assign unique port for each of them so they don't conflict
const testFiles = await fs.readdir(new URL('.', import.meta.url));
const testFileToPort = new Map();
for (let i = 0; i < testFiles.length; i++) {
	const file = testFiles[i];
	if (file.endsWith('.test.js')) {
		testFileToPort.set(file.slice(0, -8), 4000 + i);
	}
}

export function loadFixture(inlineConfig) {
	if (!inlineConfig || !inlineConfig.root)
		throw new Error("Must provide { root: './fixtures/...' }");

	const root = new URL(inlineConfig.root, import.meta.url).toString();

	return baseLoadFixture({
		...inlineConfig,
		root,
		server: {
			port: testFileToPort.get(path.basename(root)),
		},
	});
}
