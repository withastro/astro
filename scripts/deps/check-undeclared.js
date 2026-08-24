// @ts-check

// Scans built `dist/`, not `src/`: type-only imports and bundled-away modules never need resolving.

import { existsSync, readFileSync } from 'node:fs';
import { builtinModules } from 'node:module';
import * as path from 'node:path';
import { init, parse } from 'es-module-lexer';
import { globSync } from 'tinyglobby';

const root = path.resolve(import.meta.dirname, '../..');
const builtins = new Set(builtinModules);

// Resolved by the bundler or the host at runtime, never by Node's package resolution.
const virtualPrefixes = ['astro:', 'virtual:', 'cloudflare:', 'bun:', 'deno:'];

/** @param {string} specifier */
function packageName(specifier) {
	if (specifier.startsWith('@')) return specifier.split('/').slice(0, 2).join('/');
	return specifier.split('/')[0];
}

/** @param {string} specifier */
function needsDeclaration(specifier) {
	if (/^[./]/.test(specifier)) return false;
	if (specifier.startsWith('node:') || builtins.has(packageName(specifier))) return false;
	if (virtualPrefixes.some((prefix) => specifier.startsWith(prefix))) return false;
	try {
		new URL(specifier);
		return false;
	} catch {
		return true;
	}
}

const requireCallRe = /\brequire\(\s*(['"])([^'"]+)\1\s*\)/g;

/**
 * @param {string} code
 * @param {string} file
 * @returns {string[]}
 */
function specifiersOf(code, file) {
	// The lexer reports no imports at all for CommonJS rather than failing, so `require` needs its own pass.
	const specifiers = [...code.matchAll(requireCallRe)].map((match) => match[2]);
	try {
		const [imports] = parse(code, file);
		for (const record of imports) {
			if (record.n !== undefined) specifiers.push(record.n);
		}
	} catch {}
	return specifiers;
}

await init;

const manifests = globSync(['packages/**/package.json'], {
	cwd: root,
	ignore: [
		'**/node_modules/**',
		'**/dist/**',
		'**/{test,e2e}/**',
		'**/vendor/**',
		// Editor tooling ships as a bundle, so its output says nothing about what it must declare.
		'packages/language-tools/**',
	],
	absolute: true,
});

/** @type {string[]} */
const problems = [];
let checked = 0;

for (const manifestPath of manifests.sort()) {
	const pkg = JSON.parse(readFileSync(manifestPath, 'utf8'));
	if (!pkg.name || pkg.private) continue;

	const pkgDir = path.dirname(manifestPath);
	const distDir = path.join(pkgDir, 'dist');
	if (!existsSync(distDir)) continue;
	checked++;

	const declared = new Set([
		pkg.name,
		...Object.keys(pkg.dependencies ?? {}),
		...Object.keys(pkg.peerDependencies ?? {}),
		...Object.keys(pkg.optionalDependencies ?? {}),
	]);
	const subpathImports = new Set(Object.keys(pkg.imports ?? {}));

	const files = globSync(['**/*.{js,mjs,cjs}'], { cwd: distDir, absolute: true });

	/** @type {Map<string, string>} */
	const undeclared = new Map();

	for (const file of files) {
		const code = readFileSync(file, 'utf8');

		for (const specifier of specifiersOf(code, file)) {
			if (specifier.startsWith('#')) {
				if (!subpathImports.has(specifier)) {
					undeclared.set(specifier, path.relative(root, file));
				}
				continue;
			}

			if (!needsDeclaration(specifier)) continue;
			const name = packageName(specifier);
			if (declared.has(name)) continue;
			undeclared.set(name, path.relative(root, file));
		}
	}

	for (const [name, file] of [...undeclared].sort()) {
		problems.push(`  ${pkg.name} imports "${name}" but does not declare it — ${file}`);
	}
}

if (problems.length) {
	console.error(`Undeclared runtime dependencies (${problems.length}):\n${problems.join('\n')}`);
	console.error(
		'\nAdd each package to "dependencies", "peerDependencies" or "optionalDependencies" of the package that imports it.',
	);
	process.exit(1);
}

console.log(`No undeclared runtime dependencies across ${checked} packages.`);
