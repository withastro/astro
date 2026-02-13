#!/usr/bin/env node
/**
 * Compares HTML output from JSX queue rendering vs string-based rendering
 *
 * Usage:
 *   node scripts/compare-jsx-output.mjs <dir1> <dir2>
 *
 * Example:
 *   node scripts/compare-jsx-output.mjs dist/queue dist/string
 */

import { readdir, readFile } from 'node:fs/promises';
import { join, relative } from 'node:path';

const args = process.argv.slice(2);
if (args.length !== 2) {
	console.error('Usage: node compare-jsx-output.mjs <dir1> <dir2>');
	console.error('Example: node compare-jsx-output.mjs dist/queue dist/string');
	process.exit(1);
}

const [dir1, dir2] = args;

async function getAllHtmlFiles(dir, baseDir = dir) {
	const entries = await readdir(dir, { withFileTypes: true });
	const files = [];

	for (const entry of entries) {
		const fullPath = join(dir, entry.name);
		if (entry.isDirectory()) {
			files.push(...(await getAllHtmlFiles(fullPath, baseDir)));
		} else if (entry.name.endsWith('.html')) {
			files.push(relative(baseDir, fullPath));
		}
	}

	return files;
}

function findFirstDiff(a, b) {
	const minLen = Math.min(a.length, b.length);
	for (let i = 0; i < minLen; i++) {
		if (a[i] !== b[i]) return i;
	}
	return minLen;
}

function showDiffContext(pos, str, contextLen = 50) {
	const start = Math.max(0, pos - contextLen);
	const end = Math.min(str.length, pos + contextLen);
	const snippet = str.slice(start, end);
	const marker = ' '.repeat(pos - start) + '^';
	return `${snippet}\n${marker}`;
}

async function compareOutputs() {
	console.log(`\n📊 Comparing HTML outputs:\n`);
	console.log(`  Dir 1: ${dir1}`);
	console.log(`  Dir 2: ${dir2}\n`);

	// Get all HTML files from both directories
	const files1 = await getAllHtmlFiles(dir1);
	const files2 = await getAllHtmlFiles(dir2);

	// Check file counts
	if (files1.length !== files2.length) {
		console.error(`❌ Different number of files:`);
		console.error(`   ${dir1}: ${files1.length} files`);
		console.error(`   ${dir2}: ${files2.length} files`);
		return false;
	}

	console.log(`Found ${files1.length} HTML files\n`);

	// Sort for consistent comparison
	files1.sort();
	files2.sort();

	let allMatch = true;
	let matchCount = 0;
	let diffCount = 0;

	for (const file of files1) {
		if (!files2.includes(file)) {
			console.error(`❌ File missing in ${dir2}: ${file}`);
			allMatch = false;
			diffCount++;
			continue;
		}

		const content1 = await readFile(join(dir1, file), 'utf-8');
		const content2 = await readFile(join(dir2, file), 'utf-8');

		if (content1 === content2) {
			console.log(`✅ ${file}`);
			matchCount++;
		} else {
			console.error(`\n❌ ${file} - MISMATCH`);
			console.error(`   Length: ${content1.length} vs ${content2.length}`);

			const diffPos = findFirstDiff(content1, content2);
			console.error(`   First difference at position ${diffPos}:`);
			console.error(`\n   ${dir1}:`);
			console.error(`   ${showDiffContext(diffPos, content1)}`);
			console.error(`\n   ${dir2}:`);
			console.error(`   ${showDiffContext(diffPos, content2)}\n`);

			allMatch = false;
			diffCount++;
		}
	}

	console.log(`\n${'='.repeat(60)}`);
	console.log(`Results: ${matchCount} matched, ${diffCount} different`);
	console.log('='.repeat(60));

	if (allMatch) {
		console.log(`\n✅ All HTML files match! JSX queue rendering is correct.\n`);
	} else {
		console.log(`\n❌ Some files don't match. Review differences above.\n`);
	}

	return allMatch;
}

compareOutputs()
	.then((success) => {
		process.exit(success ? 0 : 1);
	})
	.catch((error) => {
		console.error('Error:', error);
		process.exit(1);
	});
