import { createHash } from 'node:crypto';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';
import { before, describe, it } from 'node:test';
import { loadFixture } from './test-utils.js';

describe('SVG File-Level Deduplication', () => {
	/** @type {import('./test-utils.js').Fixture} */
	let fixture;

	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/file-level-svg-deduplication/',
		});
		await fixture.build();
	});

	it('should prevent duplicate SVG files from being generated at file level', async () => {
		// Get all SVG files from the dist directory
		const distDir = fixture.config.outDir;
		const assetsDir = join(fileURLToPath(distDir), '_astro');

		let svgFiles = [];
		try {
			const files = readdirSync(assetsDir);
			svgFiles = files.filter((file) => file.endsWith('.svg'));
		} catch (_error) {
			assert.fail('No _astro directory found - no SVG files were generated');
		}


		// Check for hard links by examining inodes
		const inodeMap = new Map(); // inode -> filename
		const hardLinkPairs = [];
		const uniquePhysicalFiles = new Set();

		svgFiles.forEach((file) => {
			const filePath = join(assetsDir, file);
			const stats = statSync(filePath);
			const inode = stats.ino;

			uniquePhysicalFiles.add(inode);

			if (inodeMap.has(inode)) {
				hardLinkPairs.push({
					file,
					hardLinkOf: inodeMap.get(inode),
					inode,
				});
			} else {
				inodeMap.set(inode, file);
			}
		});

		// Report findings
		console.log(`Unique inodes (physical files): ${uniquePhysicalFiles.size}`);
		console.log(`Hard link pairs found: ${hardLinkPairs.length}`);

		if (hardLinkPairs.length > 0) {
			console.log('Hard link pairs:');
			hardLinkPairs.forEach((pair) => {
				console.log(`  - ${pair.file} is hard linked to ${pair.hardLinkOf} (inode: ${pair.inode})`);
			});
		}

		// Verify content uniqueness
		const contentMap = new Map(); // hash -> filename
		const duplicateContents = [];

		svgFiles.forEach((file) => {
			const filePath = join(assetsDir, file);
			const content = readFileSync(filePath, 'utf8');
			const contentHash = createHash('sha256').update(content).digest('hex').slice(0, 16);

			if (contentMap.has(contentHash)) {
				duplicateContents.push({
					file,
					duplicateOf: contentMap.get(contentHash),
					contentHash,
				});
			} else {
				contentMap.set(contentHash, file);
			}
		});

		console.log(`Unique content hashes: ${contentMap.size}`);
		console.log(`Duplicate contents found: ${duplicateContents.length}`);

		// We should have exactly 2 unique content files (duplicate1/duplicate2 content + unique content)
		assert.equal(
			contentMap.size,
			2,
			`Expected exactly 2 unique SVG contents, but found ${contentMap.size}`,
		);

		// File-level deduplication should create exactly 2 physical files via proper hard linking
		assert.equal(
			uniquePhysicalFiles.size,
			2,
			`File-level deduplication should create exactly 2 physical files, but found ${uniquePhysicalFiles.size}`,
		);

		// Hard links should be used for deduplication
		assert.equal(
			hardLinkPairs.length,
			2,
			`Expected 2 hard link pairs for deduplication, but found ${hardLinkPairs.length}`,
		);
	});

	it('should verify source files are actually identical', async () => {
		// Verify our test setup is correct - use fixture root directory
		const fixtureRoot = fileURLToPath(new URL('./fixtures/file-level-svg-deduplication/', import.meta.url));
		const duplicate1Path = join(fixtureRoot, 'src/assets/duplicate1.svg');
		const duplicate2Path = join(fixtureRoot, 'src/assets/duplicate2.svg');
		const uniquePath = join(fixtureRoot, 'src/assets/unique.svg');

		const duplicate1Content = readFileSync(duplicate1Path, 'utf8');
		const duplicate2Content = readFileSync(duplicate2Path, 'utf8');
		const uniqueContent = readFileSync(uniquePath, 'utf8');

		const hash1 = createHash('sha256').update(duplicate1Content).digest('hex').slice(0, 16);
		const hash2 = createHash('sha256').update(duplicate2Content).digest('hex').slice(0, 16);
		const hashUnique = createHash('sha256').update(uniqueContent).digest('hex').slice(0, 16);

		assert.equal(hash1, hash2, 'duplicate1.svg and duplicate2.svg should have identical content');
		assert.notEqual(
			hash1,
			hashUnique,
			'duplicate1.svg and unique.svg should have different content',
		);
	});

	it('should correctly reference deduplicated files in HTML', async () => {
		const html = await fixture.readFile('/index.html');

		// Extract all SVG references from HTML
		const svgRefs = html.match(/\/_astro\/[^"]*\.svg/g) || [];
		const uniqueRefs = [...new Set(svgRefs)];

		console.log(`Total SVG references: ${svgRefs.length}`);
		console.log(`Unique SVG references: ${uniqueRefs.length}`);
		uniqueRefs.forEach((ref) => console.log(`  - ${ref}`));

		// Should have exactly 2 unique references (one for duplicate content, one for unique content)
		assert.equal(
			uniqueRefs.length,
			2,
			`Expected 2 unique SVG references in HTML, but found ${uniqueRefs.length}`,
		);

		// With proper deduplication, there should be NO duplicate1-specific references
		// All duplicate content should use the same deduplicated file name
		const specificDuplicateRefs = svgRefs.filter(
			(ref) => ref.includes('duplicate1') || ref.includes('duplicate2'),
		);
		const allUseSameFile = specificDuplicateRefs.every((ref) => ref === specificDuplicateRefs[0]);

		assert.equal(
			allUseSameFile,
			true,
			`All references to duplicate content should use the same deduplicated filename, but found: ${JSON.stringify([...new Set(specificDuplicateRefs)])}`,
		);
	});

	it('should have fewer physical SVG files than source files when deduplication works', async () => {
		// Count source SVG files
		const fixtureRoot = fileURLToPath(new URL('./fixtures/file-level-svg-deduplication/', import.meta.url));
		const sourceDir = join(fixtureRoot, 'src/assets');
		const sourceFiles = readdirSync(sourceDir).filter((file) => file.endsWith('.svg'));

		// Count unique generated SVG files by inode
		const distDir = fixture.config.outDir;
		const assetsDir = join(fileURLToPath(distDir), '_astro');
		const distFiles = readdirSync(assetsDir).filter((file) => file.endsWith('.svg'));

		// Count unique physical files
		const uniqueInodes = new Set();
		distFiles.forEach((file) => {
			const filePath = join(assetsDir, file);
			const stats = statSync(filePath);
			uniqueInodes.add(stats.ino);
		});

		console.log(`Source SVG files: ${sourceFiles.length}`);
		console.log(`Generated SVG filenames: ${distFiles.length}`);
		console.log(`Unique physical files: ${uniqueInodes.size}`);

		// With proper file-level deduplication, we should have exactly 2 physical files (one per unique content)
		// (3 source files -> should generate only 2 physical files for 2 unique contents)
		assert.equal(
			uniqueInodes.size,
			2,
			`File-level deduplication should generate exactly 2 physical files for 2 unique contents. Generated: ${uniqueInodes.size}, Source: ${sourceFiles.length}`,
		);
	});
});
