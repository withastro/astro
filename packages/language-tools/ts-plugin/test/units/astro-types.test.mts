import 'mocha';
import assert from 'node:assert';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import ts from 'typescript';
import { astro2tsx } from '../../src/astro2tsx.js';
import { addAstroTypes } from '../../src/astro-types.js';

function createFixture() {
	const root = fs.mkdtempSync(path.join(os.tmpdir(), 'astro-ts-plugin-'));
	const src = path.join(root, 'src');
	const astroPackage = path.join(root, 'node_modules', 'astro');

	fs.mkdirSync(src, { recursive: true });
	fs.mkdirSync(astroPackage, { recursive: true });

	const utilsFile = path.join(src, 'utils.ts');
	const envFile = path.join(src, 'env.d.ts');
	const astroFile = path.join(src, 'index.astro');
	const astroTsxFile = path.join(src, 'index.astro.tsx');

	fs.writeFileSync(path.join(astroPackage, 'package.json'), '{"name":"astro","version":"6.0.0"}');
	fs.writeFileSync(
		path.join(astroPackage, 'env.d.ts'),
		[
			'type AstroGlobal = { locals: App.Locals };',
			'declare const Astro: Readonly<AstroGlobal>;',
			'declare const Fragment: any;',
		].join('\n'),
	);
	fs.writeFileSync(path.join(astroPackage, 'astro-jsx.d.ts'), '');
	fs.writeFileSync(
		utilsFile,
		[
			'export class Utils {',
			'\ttoUpper(value: string) {',
			'\t\treturn value.toUpperCase();',
			'\t}',
			'}',
		].join('\n'),
	);
	fs.writeFileSync(
		envFile,
		[
			'export {};',
			'declare global {',
			'\tnamespace App {',
			'\t\tinterface Locals {',
			'\t\t\tutils: import("./utils").Utils;',
			'\t\t}',
			'\t}',
			'}',
		].join('\n'),
	);
	fs.writeFileSync(astroFile, '<div>{Astro.locals.utils.toUpper("Astro")}</div>\n');
	const astroTsx = astro2tsx(fs.readFileSync(astroFile, 'utf8'), astroFile);
	fs.writeFileSync(
		astroTsxFile,
		astroTsx.virtualFile.snapshot.getText(0, astroTsx.virtualFile.snapshot.getLength()),
	);

	return { root, files: [utilsFile, envFile, astroTsxFile], utilsFile, astroTsxFile };
}

function findToUpperReferenceFiles(injectAstroTypes: boolean) {
	const fixture = createFixture();
	const versions = new Map(fixture.files.map((fileName) => [fileName, '0']));
	const host: ts.LanguageServiceHost = {
		getScriptFileNames: () => fixture.files,
		getScriptVersion: (fileName) => versions.get(fileName) ?? '0',
		getScriptSnapshot: (fileName) => {
			if (!fs.existsSync(fileName)) {
				return undefined;
			}
			return ts.ScriptSnapshot.fromString(fs.readFileSync(fileName, 'utf8'));
		},
		getCurrentDirectory: () => fixture.root,
		getCompilationSettings: () => ({
			allowJs: true,
			jsx: ts.JsxEmit.Preserve,
			module: ts.ModuleKind.ESNext,
			moduleResolution: ts.ModuleResolutionKind.Node10,
			target: ts.ScriptTarget.ESNext,
		}),
		getDefaultLibFileName: (options) => ts.getDefaultLibFilePath(options),
		fileExists: ts.sys.fileExists,
		readFile: ts.sys.readFile,
		readDirectory: ts.sys.readDirectory,
		directoryExists: ts.sys.directoryExists,
		getDirectories: ts.sys.getDirectories,
		useCaseSensitiveFileNames: () => ts.sys.useCaseSensitiveFileNames,
		getNewLine: () => ts.sys.newLine,
		getScriptKind: (fileName) => (fileName.endsWith('.tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS),
	};

	if (injectAstroTypes) {
		addAstroTypes(ts, host, fixture.root);
	}

	const service = ts.createLanguageService(host);
	const utilsText = fs.readFileSync(fixture.utilsFile, 'utf8');
	const references = service.findReferences(fixture.utilsFile, utilsText.indexOf('toUpper')) ?? [];

	try {
		return references.flatMap((entry) =>
			entry.references.map((reference) => path.relative(fixture.root, reference.fileName)),
		);
	} finally {
		fs.rmSync(fixture.root, { recursive: true, force: true });
	}
}

suite('Astro type injection', () => {
	test('reproduces the missing Astro.locals reference without Astro types', () => {
		const referencesWithoutAstroTypes = findToUpperReferenceFiles(false);
		assert.ok(
			!referencesWithoutAstroTypes.includes(path.join('src', 'index.astro.tsx')),
			'fixture should reproduce missing Astro.locals references before injecting Astro types',
		);
	});

	test('finds references through Astro.locals once Astro types are injected', () => {
		const referencesWithAstroTypes = findToUpperReferenceFiles(true);
		assert.ok(
			referencesWithAstroTypes.includes(path.join('src', 'index.astro.tsx')),
			'should find the Astro.locals reference in the Astro file',
		);
	});
});
