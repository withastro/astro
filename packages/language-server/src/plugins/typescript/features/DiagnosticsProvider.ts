import ts from 'typescript';
import { CancellationToken } from 'vscode-languageserver';
import { Diagnostic, DiagnosticTag } from 'vscode-languageserver-types';
import { AstroDocument, mapRangeToOriginal } from '../../../core/documents';
import { DiagnosticsProvider } from '../../interfaces';
import { LanguageServiceManager } from '../LanguageServiceManager';
import { AstroSnapshot, SnapshotFragment } from '../snapshots/DocumentSnapshot';
import { convertRange, getScriptTagSnapshot, mapSeverity, toVirtualAstroFilePath } from '../utils';

type BoundaryTuple = [number, number];

interface BoundaryParseResults {
	script: BoundaryTuple[];
	markdown: BoundaryTuple[];
}

// List of codes:
// https://github.com/Microsoft/TypeScript/blob/main/src/compiler/diagnosticMessages.json
export enum DiagnosticCodes {
	SPREAD_EXPECTED = 1005, // '{0}' expected.
	IS_NOT_A_MODULE = 2306, // '{0}' is not a module.
	DUPLICATED_JSX_ATTRIBUTES = 17001, // JSX elements cannot have multiple attributes with the same name.
	MUST_HAVE_PARENT_ELEMENT = 2657, // JSX expressions must have one parent element.
	CANT_RETURN_OUTSIDE_FUNC = 1108, // A 'return' statement can only be used within a function body.
	ISOLATED_MODULE_COMPILE_ERR = 1208, // '{0}' cannot be compiled under '--isolatedModules' because it is considered a global script file.
	TYPE_NOT_ASSIGNABLE = 2322, // Type '{0}' is not assignable to type '{1}'.
	JSX_NO_CLOSING_TAG = 17008, // JSX element '{0}' has no corresponding closing tag.
	NO_DECL_IMPLICIT_ANY_TYPE = 7016, // Could not find a declaration file for module '{0}'. '{1}' implicitly has an 'any' type.
	JSX_ELEMENT_NO_CALL = 2604, // JSX element type '{0}' does not have any construct or call signatures.
}

export class DiagnosticsProviderImpl implements DiagnosticsProvider {
	constructor(private readonly languageServiceManager: LanguageServiceManager) {}

	async getDiagnostics(document: AstroDocument, _cancellationToken?: CancellationToken): Promise<Diagnostic[]> {
		// Don't return diagnostics for files inside node_modules. These are considered read-only
		// and they would pollute the output for astro check
		if (document.getFilePath()?.includes('/node_modules/') || document.getFilePath()?.includes('\\node_modules\\')) {
			return [];
		}

		const { lang, tsDoc } = await this.languageServiceManager.getLSAndTSDoc(document);

		const filePath = toVirtualAstroFilePath(tsDoc.filePath);
		const fragment = await tsDoc.createFragment();

		let scriptDiagnostics: Diagnostic[] = [];

		document.scriptTags.forEach((scriptTag) => {
			const { filePath: scriptFilePath, snapshot: scriptTagSnapshot } = getScriptTagSnapshot(
				tsDoc as AstroSnapshot,
				document,
				scriptTag.container
			);

			const scriptDiagnostic = [
				...lang.getSyntacticDiagnostics(scriptFilePath),
				...lang.getSuggestionDiagnostics(scriptFilePath),
				...lang.getSemanticDiagnostics(scriptFilePath),
			]
				// We need to duplicate the diagnostic creation here because we can't map TS's diagnostics range to the original
				// file due to some internal cache inside TS that would cause it to being mapped twice in some cases
				.map<Diagnostic>((diagnostic) => ({
					range: convertRange(scriptTagSnapshot, diagnostic),
					severity: mapSeverity(diagnostic.category),
					source: 'ts',
					message: ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n'),
					code: diagnostic.code,
					tags: getDiagnosticTag(diagnostic),
				}))
				.map(mapRange(scriptTagSnapshot, document));

			scriptDiagnostics.push(...scriptDiagnostic);
		});

		const { script: scriptBoundaries } = this.getTagBoundaries(lang, filePath);

		const diagnostics: ts.Diagnostic[] = [
			...lang.getSyntacticDiagnostics(filePath),
			...lang.getSuggestionDiagnostics(filePath),
			...lang.getSemanticDiagnostics(filePath),
		].filter((diag) => {
			return isNoWithinBoundary(scriptBoundaries, diag);
		});

		return [
			...diagnostics
				.map<Diagnostic>((diagnostic) => ({
					range: convertRange(tsDoc, diagnostic),
					severity: mapSeverity(diagnostic.category),
					source: 'ts',
					message: ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n'),
					code: diagnostic.code,
					tags: getDiagnosticTag(diagnostic),
				}))
				.map(mapRange(fragment, document)),
			...scriptDiagnostics,
		]
			.filter((diag) => {
				return (
					// Make sure the diagnostic is inside the document and not in generated code
					diag.range.start.line <= document.lineCount &&
					hasNoNegativeLines(diag) &&
					isNoJSXMustHaveOneParent(diag) &&
					isNoSpreadExpected(diag, document) &&
					isNoCantReturnOutsideFunction(diag) &&
					isNoIsolatedModuleError(diag) &&
					isNoImportImplicitAnyType(diag) &&
					isNoJsxCannotHaveMultipleAttrsError(diag)
				);
			})
			.map(enhanceIfNecessary);
	}

	private getTagBoundaries(lang: ts.LanguageService, tsFilePath: string): BoundaryParseResults {
		const program = lang.getProgram();
		const sourceFile = program?.getSourceFile(tsFilePath);

		const boundaries: BoundaryParseResults = {
			script: [],
			markdown: [],
		};

		if (!sourceFile) {
			return boundaries;
		}

		function findTags(parent: ts.Node) {
			ts.forEachChild(parent, (node) => {
				if (ts.isJsxElement(node)) {
					let tagName = node.openingElement.tagName.getText();

					switch (tagName) {
						case 'script': {
							ts.getLineAndCharacterOfPosition(sourceFile!, node.getStart());
							boundaries.script.push([node.getStart(), node.getEnd()]);
							break;
						}
						case 'Markdown': {
							boundaries.markdown.push([node.getStart(), node.getEnd()]);
							break;
						}
					}
				}
				findTags(node);
			});
		}

		findTags(sourceFile);
		return boundaries;
	}
}

function isWithinBoundaries(boundaries: BoundaryTuple[], start: number): boolean {
	for (let [bstart, bend] of boundaries) {
		if (start > bstart && start < bend) {
			return true;
		}
	}
	return false;
}

function diagnosticIsWithinBoundaries(
	sourceFile: ts.SourceFile | undefined,
	boundaries: BoundaryTuple[],
	diagnostic: Diagnostic | ts.Diagnostic
) {
	if ('start' in diagnostic) {
		if (diagnostic.start == null) return false;
		return isWithinBoundaries(boundaries, diagnostic.start);
	}

	if (!sourceFile) return false;

	let startRange = (diagnostic as Diagnostic).range.start;
	let pos = ts.getPositionOfLineAndCharacter(sourceFile, startRange.line, startRange.character);
	return isWithinBoundaries(boundaries, pos);
}

function isNoWithinBoundary(boundaries: BoundaryTuple[], diagnostic: ts.Diagnostic) {
	return !diagnosticIsWithinBoundaries(undefined, boundaries, diagnostic);
}

function mapRange(fragment: SnapshotFragment, _document: AstroDocument): (value: Diagnostic) => Diagnostic {
	return (diagnostic) => {
		let range = mapRangeToOriginal(fragment, diagnostic.range);

		return { ...diagnostic, range };
	};
}

/**
 * In some rare cases mapping of diagnostics does not work and produces negative lines.
 * We filter out these diagnostics with negative lines because else the LSP
 * apparently has a hiccup and does not show any diagnostics at all.
 */
function hasNoNegativeLines(diagnostic: Diagnostic): boolean {
	return diagnostic.range.start.line >= 0 && diagnostic.range.end.line >= 0;
}

/**
 * Astro allows multiple attributes to have the same name
 */
function isNoJsxCannotHaveMultipleAttrsError(diagnostic: Diagnostic) {
	return diagnostic.code !== DiagnosticCodes.DUPLICATED_JSX_ATTRIBUTES;
}

/** Astro allows component with multiple root elements */
function isNoJSXMustHaveOneParent(diagnostic: Diagnostic) {
	return diagnostic.code !== DiagnosticCodes.MUST_HAVE_PARENT_ELEMENT;
}

function isNoImportImplicitAnyType(diagnostic: Diagnostic) {
	return diagnostic.code !== DiagnosticCodes.NO_DECL_IMPLICIT_ANY_TYPE;
}

/**
 * When using the shorthand syntax for props TSX expects you to use the spread operator
 * Since the shorthand syntax works differently in Astro and this is not required, hide this message
 * However, the error code used here is quite generic, as such we need to make we only ignore in valid cases
 */
function isNoSpreadExpected(diagnostic: Diagnostic, document: AstroDocument) {
	if (
		diagnostic.code === DiagnosticCodes.SPREAD_EXPECTED &&
		diagnostic.message.includes('...') &&
		document.offsetAt(diagnostic.range.start) > (document.astroMeta.frontmatter.endOffset ?? 0)
	) {
		return false;
	}

	return true;
}

/**
 * Ignore "Can't return outside of function body"
 * Since the frontmatter is at the top level, users trying to return a Response  for SSR mode run into this
 */
function isNoCantReturnOutsideFunction(diagnostic: Diagnostic) {
	return diagnostic.code !== DiagnosticCodes.CANT_RETURN_OUTSIDE_FUNC;
}

/**
 * When the content of the file is invalid and can't be parsed properly for TSX generation, TS will show an error about
 * how the current module can't be compiled under --isolatedModule, this is confusing to users so let's ignore this
 */
function isNoIsolatedModuleError(diagnostic: Diagnostic) {
	return diagnostic.code !== DiagnosticCodes.ISOLATED_MODULE_COMPILE_ERR;
}

/**
 * Some diagnostics have JSX-specific nomenclature or unclear description. Enhance them for more clarity.
 */
function enhanceIfNecessary(diagnostic: Diagnostic): Diagnostic {
	// When the language integrations are not installed, the content of the imported snapshot is empty
	// As such, it triggers the "is not a module error", which we can enhance with a more helpful message for the related framework
	if (diagnostic.code === DiagnosticCodes.IS_NOT_A_MODULE) {
		if (diagnostic.message.includes('.svelte')) {
			diagnostic.message +=
				'\n\nIs the `@astrojs/svelte` package installed? You can add it to your project by running the following command: `astro add svelte`. If already installed, restarting the language server might be necessary in order for the change to take effect';
		}

		if (diagnostic.message.includes('.vue')) {
			diagnostic.message +=
				'\n\nIs the `@astrojs/vue` package installed? You can add it to your project by running the following command: `astro add vue`. If already installed, restarting the language server might be necessary in order for the change to take effect';
		}
	}

	// JSX element has no closing tag. JSX -> HTML
	if (diagnostic.code === DiagnosticCodes.JSX_NO_CLOSING_TAG) {
		return {
			...diagnostic,
			message: diagnostic.message.replace('JSX', 'HTML'),
		};
	}

	// JSX Element can't be constructed or called. This happens on syntax errors / invalid components
	if (diagnostic.code === DiagnosticCodes.JSX_ELEMENT_NO_CALL) {
		return {
			...diagnostic,
			message: diagnostic.message
				.replace('JSX element type', 'Component')
				.replace(
					'does not have any construct or call signatures.',
					'is not a valid component.\n\nIf this is a Svelte or Vue component, it might have a syntax error that makes it impossible to parse.'
				),
		};
	}

	// For the rare case where an user might try to put a client directive on something that is not a component
	if (diagnostic.code === DiagnosticCodes.TYPE_NOT_ASSIGNABLE) {
		if (diagnostic.message.includes("Property 'client:") && diagnostic.message.includes("to type 'HTMLProps")) {
			return {
				...diagnostic,
				message: 'Client directives are only available on framework components',
			};
		}
	}

	return diagnostic;
}

function getDiagnosticTag(diagnostic: ts.Diagnostic): DiagnosticTag[] {
	const tags: DiagnosticTag[] = [];

	if (diagnostic.reportsUnnecessary) {
		tags.push(DiagnosticTag.Unnecessary);
	}

	if (diagnostic.reportsDeprecated) {
		tags.push(DiagnosticTag.Deprecated);
	}

	return tags;
}
