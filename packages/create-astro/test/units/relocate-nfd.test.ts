import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { describe, it } from 'node:test';
import { relocateNFDFiles } from '../../dist/index.js';

// NFC: ü = U+00FC (single code point)
// NFD: ü = u + U+0308 (combining diaeresis)
const NFC_NAME = 'Masa\u00FCst\u00FC';
const NFD_NAME = NFC_NAME.normalize('NFD');

// Skip on macOS where the filesystem normalizes NFC/NFD to the same path
const isNFDTransparent = (() => {
	const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'nfd-check-'));
	const nfcDir = path.join(tmp, NFC_NAME);
	const nfdDir = path.join(tmp, NFD_NAME);
	fs.mkdirSync(nfcDir);
	const same = fs.existsSync(nfdDir) && fs.statSync(nfcDir).ino === fs.statSync(nfdDir).ino;
	fs.rmSync(tmp, { recursive: true });
	return same;
})();

describe('relocateNFDFiles', { skip: isNFDTransparent && 'filesystem normalizes NFC/NFD' }, () => {
	function createTempDir() {
		const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'astro-nfd-'));
		return tmp;
	}

	it('moves files from NFD directory to NFC directory', async () => {
		const tmp = createTempDir();
		const nfcDir = path.join(tmp, NFC_NAME, 'project');
		const nfdDir = path.join(tmp, NFD_NAME, 'project');

		// Simulate what modern-tar does: create NFC dir (empty) and NFD dir (with files)
		fs.mkdirSync(nfcDir, { recursive: true });
		fs.mkdirSync(nfdDir, { recursive: true });
		fs.writeFileSync(path.join(nfdDir, 'package.json'), '{}');
		fs.mkdirSync(path.join(nfdDir, 'src'));
		fs.writeFileSync(path.join(nfdDir, 'src', 'index.ts'), 'export {}');

		await relocateNFDFiles(nfcDir);

		// Files should now be in NFC directory
		assert.ok(fs.existsSync(path.join(nfcDir, 'package.json')));
		assert.ok(fs.existsSync(path.join(nfcDir, 'src', 'index.ts')));

		// NFD directory should be cleaned up
		assert.ok(!fs.existsSync(nfdDir));

		fs.rmSync(tmp, { recursive: true });
	});

	it('is a no-op for ASCII-only paths', async () => {
		const tmp = createTempDir();
		const dir = path.join(tmp, 'my-project');
		fs.mkdirSync(dir);
		fs.writeFileSync(path.join(dir, 'package.json'), '{}');

		await relocateNFDFiles(dir);

		assert.ok(fs.existsSync(path.join(dir, 'package.json')));

		fs.rmSync(tmp, { recursive: true });
	});

	it('is a no-op when NFD directory does not exist', async () => {
		const tmp = createTempDir();
		const nfcDir = path.join(tmp, NFC_NAME);
		fs.mkdirSync(nfcDir);
		fs.writeFileSync(path.join(nfcDir, 'package.json'), '{}');

		await relocateNFDFiles(nfcDir);

		assert.ok(fs.existsSync(path.join(nfcDir, 'package.json')));

		fs.rmSync(tmp, { recursive: true });
	});
});
