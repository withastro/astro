import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { after, before, describe, it } from 'node:test';
import { resolvePath } from '../../../dist/core/viteUtils.js';

describe('resolvePath', () => {
	let root: string;
	let importer: string;

	/** Create an empty fixture file (and its parent dirs) inside the temp root. */
	function touch(relativePath: string) {
		const filePath = path.join(root, relativePath);
		mkdirSync(path.dirname(filePath), { recursive: true });
		writeFileSync(filePath, '');
	}

	/** Posix-normalized absolute path of a fixture, as `resolvePath` returns it. */
	function abs(relativePath: string) {
		return path.posix.normalize(path.join(root, relativePath).replace(/\\/g, '/'));
	}

	before(() => {
		root = mkdtempSync(path.join(tmpdir(), 'astro-resolve-path-'));
		importer = path.join(root, 'src/pages/index.astro');
		touch('src/pages/index.astro');
		touch('src/components/Counter.tsx');
		touch('src/components/OnlyTs.ts');
		touch('src/components/OnlyJsx.jsx');
		touch('src/components/Module.mjs');
		touch('src/components/ModuleTs.mts');
		// Both candidates exist: Vite's default extension order (.js before .tsx) must win.
		touch('src/components/Order.js');
		touch('src/components/Order.tsx');
		// Directory index import.
		touch('src/components/widgets/index.ts');
		// Both a directory with an index and a sibling file: extension probing wins over the index.
		touch('src/components/Amb/index.ts');
		touch('src/components/Amb.tsx');
		// Extensionless file that exists as-is must not be probed.
		touch('src/components/LICENSE');
		touch('src/components/LICENSE.js');
		// `.jsx` specifier for an on-disk `.tsx` file (resolveJsToTs remap).
		touch('src/components/Remap.tsx');
	});

	after(() => {
		rmSync(root, { recursive: true, force: true });
	});

	it('resolves an extensionless import to the on-disk .tsx file', () => {
		assert.equal(resolvePath('../components/Counter', importer), abs('src/components/Counter.tsx'));
	});

	it('resolves extensionless imports to .ts, .jsx, .mjs and .mts files', () => {
		assert.equal(resolvePath('../components/OnlyTs', importer), abs('src/components/OnlyTs.ts'));
		assert.equal(resolvePath('../components/OnlyJsx', importer), abs('src/components/OnlyJsx.jsx'));
		assert.equal(resolvePath('../components/Module', importer), abs('src/components/Module.mjs'));
		assert.equal(
			resolvePath('../components/ModuleTs', importer),
			abs('src/components/ModuleTs.mts'),
		);
	});

	it("respects Vite's default extension order when multiple candidates exist", () => {
		// Both Order.js and Order.tsx exist; Vite tries `.js` before `.tsx`.
		assert.equal(resolvePath('../components/Order', importer), abs('src/components/Order.js'));
	});

	it('resolves a directory import to its index module', () => {
		assert.equal(
			resolvePath('../components/widgets', importer),
			abs('src/components/widgets/index.ts'),
		);
	});

	it('prefers a sibling file over a directory index, like Vite', () => {
		// Both `Amb/index.ts` and `Amb.tsx` exist; Vite probes extensions before index files.
		assert.equal(resolvePath('../components/Amb', importer), abs('src/components/Amb.tsx'));
	});

	it('returns extension-ful specifiers unchanged', () => {
		assert.equal(
			resolvePath('../components/Counter.tsx', importer),
			abs('src/components/Counter.tsx'),
		);
	});

	it('does not probe extensions when the extensionless path exists as a file', () => {
		// `LICENSE` exists on disk, so it must win over `LICENSE.js`.
		assert.equal(resolvePath('../components/LICENSE', importer), abs('src/components/LICENSE'));
	});

	it('still remaps a .jsx specifier to an on-disk .tsx file', () => {
		assert.equal(resolvePath('../components/Remap.jsx', importer), abs('src/components/Remap.tsx'));
	});

	it('returns a non-existent extensionless path unchanged', () => {
		assert.equal(resolvePath('../components/Missing', importer), abs('src/components/Missing'));
	});

	it('leaves bare specifiers untouched', () => {
		assert.equal(resolvePath('react', importer), 'react');
		assert.equal(resolvePath('@astrojs/react/client.js', importer), '@astrojs/react/client.js');
	});

	it('leaves unresolvable # subpath specifiers untouched', () => {
		assert.equal(resolvePath('#components/Counter', importer), '#components/Counter');
	});
});
