import 'mocha';
import assert from 'node:assert';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import ts from 'typescript';
import { astro2tsx } from '../../src/astro2tsx.js';
import { addAstroTypes, isAstroProject } from '../../src/astro-types.js';

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

function createHoistedMonorepo() {
	const root = fs.mkdtempSync(path.join(os.tmpdir(), 'astro-ts-plugin-monorepo-'));
	const astroPackage = path.join(root, 'node_modules', 'astro');
	const docs = path.join(root, 'apps', 'docs');
	const frontend = path.join(root, 'apps', 'frontend');
	const standalone = path.join(root, 'apps', 'standalone');

	fs.mkdirSync(astroPackage, { recursive: true });
	fs.mkdirSync(docs, { recursive: true });
	fs.mkdirSync(frontend, { recursive: true });
	fs.mkdirSync(standalone, { recursive: true });

	fs.writeFileSync(path.join(astroPackage, 'package.json'), '{"name":"astro","version":"6.0.0"}');
	fs.writeFileSync(path.join(root, 'package.json'), '{"name":"monorepo","private":true}');
	fs.writeFileSync(
		path.join(docs, 'package.json'),
		'{"name":"docs","dependencies":{"astro":"^6.0.0"}}',
	);
	fs.writeFileSync(
		path.join(frontend, 'package.json'),
		'{"name":"frontend","dependencies":{"react":"^19.0.0"}}',
	);
	fs.writeFileSync(path.join(standalone, 'package.json'), '{"name":"standalone"}');
	fs.writeFileSync(path.join(standalone, 'astro.config.mjs'), 'export default {};\n');

	return { root, docs, frontend, standalone };
}

suite('Astro project detection', () => {
	test('skips a project that only reaches Astro through a hoisted node_modules', () => {
		const monorepo = createHoistedMonorepo();

		try {
			assert.strictEqual(isAstroProject(ts, monorepo.frontend), false);
		} finally {
			fs.rmSync(monorepo.root, { recursive: true, force: true });
		}
	});

	test('detects a project that depends on Astro', () => {
		const monorepo = createHoistedMonorepo();

		try {
			assert.strictEqual(isAstroProject(ts, monorepo.docs), true);
		} finally {
			fs.rmSync(monorepo.root, { recursive: true, force: true });
		}
	});

	test('detects a project with an Astro config but no Astro dependency', () => {
		const monorepo = createHoistedMonorepo();

		try {
			assert.strictEqual(isAstroProject(ts, monorepo.standalone), true);
		} finally {
			fs.rmSync(monorepo.root, { recursive: true, force: true });
		}
	});
});

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

suite('Astro TSX conversion', () => {
	test('excludes script and style contents from the virtual TSX', () => {
		const input =
			'<script>const scriptMarker = true;</script><style>.styleMarker { color: red }</style><div>{Astro.url}</div>';
		const { virtualFile } = astro2tsx(input, 'Page.astro');
		const code = virtualFile.snapshot.getText(0, virtualFile.snapshot.getLength());

		assert.ok(code.includes('Astro.url'));
		assert.ok(!code.includes('scriptMarker'));
		assert.ok(!code.includes('styleMarker'));
	});
});

function withAutoImportFixture(
	scriptText: string,
	run: (service: ts.LanguageService, scriptFileName: string) => void,
) {
	const root = fs.mkdtempSync(path.join(os.tmpdir(), 'astro-ts-plugin-auto-import-'));
	const src = path.join(root, 'src');
	fs.mkdirSync(src, { recursive: true });

	const astroFile = path.join(src, 'Footer.astro');
	const virtualFileName = `${astroFile}.tsx`;
	const scriptFileName = path.join(src, 'temp.ts');
	const { virtualFile } = astro2tsx('<footer>Footer</footer>', astroFile);
	fs.writeFileSync(
		virtualFileName,
		virtualFile.snapshot.getText(0, virtualFile.snapshot.getLength()),
	);
	fs.writeFileSync(scriptFileName, scriptText);

	const files = [virtualFileName, scriptFileName];
	const host: ts.LanguageServiceHost = {
		getScriptFileNames: () => files,
		getScriptVersion: () => '0',
		getScriptSnapshot: (fileName) => {
			if (!fs.existsSync(fileName)) return undefined;
			return ts.ScriptSnapshot.fromString(fs.readFileSync(fileName, 'utf8'));
		},
		getCurrentDirectory: () => root,
		getCompilationSettings: () => ({
			allowJs: true,
			jsx: ts.JsxEmit.Preserve,
			module: ts.ModuleKind.ESNext,
			moduleResolution: ts.ModuleResolutionKind.Bundler,
			target: ts.ScriptTarget.ESNext,
		}),
		getDefaultLibFileName: (options) => ts.getDefaultLibFilePath(options),
		fileExists: (fileName) => fs.existsSync(fileName),
		readFile: (fileName) => fs.readFileSync(fileName, 'utf8'),
		readDirectory: ts.sys.readDirectory,
		directoryExists: ts.sys.directoryExists,
		getDirectories: ts.sys.getDirectories,
		useCaseSensitiveFileNames: () => ts.sys.useCaseSensitiveFileNames,
		getNewLine: () => ts.sys.newLine,
	};

	try {
		run(ts.createLanguageService(host), scriptFileName);
	} finally {
		fs.rmSync(root, { recursive: true, force: true });
	}
}

const completionPreferences: ts.UserPreferences = {
	includeCompletionsForImportStatements: true,
	includeCompletionsForModuleExports: true,
	includeCompletionsWithInsertText: true,
};

suite('Astro TSX auto-imports', () => {
	test('does not suggest the generated component name', () => {
		withAutoImportFixture('import Foo', (service, scriptFileName) => {
			const completions = service.getCompletionsAtPosition(
				scriptFileName,
				10,
				completionPreferences,
			);
			const componentNames = completions?.entries
				.filter((entry) => entry.source?.includes('Footer.astro'))
				.map((entry) => entry.name);

			assert.ok(componentNames?.includes('Footer'));
			assert.ok(!componentNames?.includes('FooterAstroComponent'));
		});
	});

	test('completes a component with a default import', () => {
		const scriptText = 'export const x = Foot;';
		withAutoImportFixture(scriptText, (service, scriptFileName) => {
			const position = scriptText.indexOf(';');
			const entries =
				service
					.getCompletionsAtPosition(scriptFileName, position, completionPreferences)
					?.entries.filter((entry) => entry.source?.includes('Footer.astro')) ?? [];

			assert.deepStrictEqual(
				entries.map((entry) => entry.name),
				['Footer'],
			);
			const [entry] = entries;
			const details = service.getCompletionEntryDetails(
				scriptFileName,
				position,
				'Footer',
				{},
				entry.source,
				completionPreferences,
				entry.data,
			);
			const insertedText = details?.codeActions?.flatMap((action) =>
				action.changes.flatMap((change) =>
					change.textChanges.map((textChange) => textChange.newText),
				),
			);
			assert.deepStrictEqual(insertedText, ['import Footer from "./Footer.astro";\n\n']);
		});
	});

	test('offers only a default import quick fix for a component', () => {
		const scriptText = 'export const x = Footer;';
		withAutoImportFixture(scriptText, (service, scriptFileName) => {
			const start = scriptText.indexOf('Footer');
			const fixes = service.getCodeFixesAtPosition(
				scriptFileName,
				start,
				start + 'Footer'.length,
				[2304],
				{},
				{},
			);
			const insertedText = fixes.flatMap((fix) =>
				fix.changes.flatMap((change) => change.textChanges.map((textChange) => textChange.newText)),
			);

			assert.deepStrictEqual(insertedText, ['import Footer from "./Footer.astro";\n\n']);
		});
	});

	test('reports a named import of a component', () => {
		withAutoImportFixture(
			"import { Footer } from './Footer.astro';\nexport const x = Footer;",
			(service, scriptFileName) => {
				const codes = service
					.getSemanticDiagnostics(scriptFileName)
					.map((diagnostic) => diagnostic.code);

				// TS2614: Module has no exported member. Did you mean to use a default import instead?
				assert.deepStrictEqual(codes, [2614]);
			},
		);
	});
});
