import assert from 'node:assert';
import path from 'node:path';
import { describe, it } from 'node:test';
import { isInIgnoredDirectory } from '../dist/watch.js';

describe('astro-check - watch ignore', () => {
	it('does not ignore files when the project root path contains node_modules or .git', () => {
		for (const root of [
			path.resolve('/projects/folder-name-contains-node_modules'),
			path.resolve('/projects/node_modules/site'),
			path.resolve('/projects/site.git'),
		]) {
			assert.strictEqual(isInIgnoredDirectory(root, root), false);
			assert.strictEqual(
				isInIgnoredDirectory(root, path.join(root, 'src', 'pages', 'index.astro')),
				false,
			);
		}
	});

	it('ignores node_modules and .git directories inside the project root', () => {
		const root = path.resolve('/projects/site');
		assert.strictEqual(isInIgnoredDirectory(root, path.join(root, 'node_modules')), true);
		assert.strictEqual(
			isInIgnoredDirectory(root, path.join(root, 'node_modules', 'pkg', 'index.d.ts')),
			true,
		);
		assert.strictEqual(isInIgnoredDirectory(root, path.join(root, '.git', 'HEAD')), true);
		assert.strictEqual(
			isInIgnoredDirectory(root, path.join(root, '.github', 'workflow.ts')),
			false,
		);
	});
});
