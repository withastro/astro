import ts from 'typescript';
import { CancellationToken, Diagnostic, DiagnosticSeverity } from 'vscode-languageserver';
import {
    Document,
    getNodeIfIsInStartTag,
    getTextInRange,
    isRangeInTag,
    mapRangeToOriginal
} from '../../../lib/documents';
import { DiagnosticsProvider } from '../../interfaces';
import { LSAndTSDocResolver } from '../LSAndTSDocResolver';
import { convertRange, getDiagnosticTag, hasNonZeroRange, mapSeverity } from '../utils';
import { SvelteDocumentSnapshot, SvelteSnapshotFragment } from '../DocumentSnapshot';
import {
    isInGeneratedCode,
    isAfterSvelte2TsxPropsReturn,
    findNodeAtSpan,
    isReactiveStatement,
    isInReactiveStatement,
    gatherIdentifiers
} from './utils';
import { not, flatten, passMap, regexIndexOf, swapRangeStartEndIfNecessary } from '../../../utils';
import { LSConfigManager } from '../../../ls-config';
import { isAttributeName, isEventHandler } from '../svelte-ast-utils';

enum DiagnosticCode {
    MODIFIERS_CANNOT_APPEAR_HERE = 1184, // "Modifiers cannot appear here."
    USED_BEFORE_ASSIGNED = 2454, // "Variable '{0}' is used before being assigned."
    JSX_ELEMENT_DOES_NOT_SUPPORT_ATTRIBUTES = 2607, // "JSX element class does not support attributes because it does not have a '{0}' property."
    CANNOT_BE_USED_AS_JSX_COMPONENT = 2786, // "'{0}' cannot be used as a JSX component."
    NOOP_IN_COMMAS = 2695, // "Left side of comma operator is unused and has no side effects."
    NEVER_READ = 6133, // "'{0}' is declared but its value is never read."
    ALL_IMPORTS_UNUSED = 6192, // "All imports in import declaration are unused."
    UNUSED_LABEL = 7028, // "Unused label."
    DUPLICATED_JSX_ATTRIBUTES = 17001, // "JSX elements cannot have multiple attributes with the same name."
    DUPLICATE_IDENTIFIER = 2300, // "Duplicate identifier 'xxx'"
    MULTIPLE_PROPS_SAME_NAME = 1117, // "An object literal cannot have multiple properties with the same name in strict mode."
    TYPE_X_NOT_ASSIGNABLE_TO_TYPE_Y = 2345, // "Argument of type '..' is not assignable to parameter of type '..'."
    MISSING_PROPS = 2739, // "Type '...' is missing the following properties from type '..': ..."
    MISSING_PROP = 2741 // "Property '..' is missing in type '..' but required in type '..'."
}

export class DiagnosticsProviderImpl implements DiagnosticsProvider {
    constructor(
        private readonly lsAndTsDocResolver: LSAndTSDocResolver,
        private configManager: LSConfigManager
    ) {}

    async getDiagnostics(
        document: Document,
        cancellationToken?: CancellationToken
    ): Promise<Diagnostic[]> {
        const { lang, tsDoc } = await this.getLSAndTSDoc(document);

        if (
            ['coffee', 'coffeescript'].includes(document.getLanguageAttribute('script')) ||
            cancellationToken?.isCancellationRequested
        ) {
            return [];
        }

        const isTypescript =
            tsDoc.scriptKind === ts.ScriptKind.TSX || tsDoc.scriptKind === ts.ScriptKind.TS;

        // Document preprocessing failed, show parser error instead
        if (tsDoc.parserError) {
            return [
                {
                    range: tsDoc.parserError.range,
                    severity: DiagnosticSeverity.Error,
                    source: isTypescript ? 'ts' : 'js',
                    message: tsDoc.parserError.message,
                    code: tsDoc.parserError.code
                }
            ];
        }

        const fragment = tsDoc.getFragment();

        let diagnostics: ts.Diagnostic[] = [
            ...lang.getSyntacticDiagnostics(tsDoc.filePath),
            ...lang.getSuggestionDiagnostics(tsDoc.filePath),
            ...lang.getSemanticDiagnostics(tsDoc.filePath)
        ];
        diagnostics = diagnostics
            .filter(isNotGenerated(tsDoc.getText(0, tsDoc.getLength())))
            .filter(not(isUnusedReactiveStatementLabel));
        diagnostics = resolveNoopsInReactiveStatements(lang, diagnostics);

        return diagnostics
            .map<Diagnostic>((diagnostic) => ({
                range: convertRange(tsDoc, diagnostic),
                severity: mapSeverity(diagnostic.category),
                source: isTypescript ? 'ts' : 'js',
                message: ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n'),
                code: diagnostic.code,
                tags: getDiagnosticTag(diagnostic)
            }))
            .map(
                mapRange(
                    fragment,
                    document,
                    this.configManager.getConfig().svelte.useNewTransformation
                )
            )
            .filter(hasNoNegativeLines)
            .filter(
                isNoFalsePositive(
                    this.configManager.getConfig().svelte.useNewTransformation,
                    document,
                    tsDoc
                )
            )
            .map(enhanceIfNecessary)
            .map(swapDiagRangeStartEndIfNecessary);
    }

    private async getLSAndTSDoc(document: Document) {
        return this.lsAndTsDocResolver.getLSAndTSDoc(document);
    }
}

function mapRange(
    fragment: SvelteSnapshotFragment,
    document: Document,
    useNewTransformation: boolean
): (value: Diagnostic) => Diagnostic {
    return (diagnostic) => {
        let range = mapRangeToOriginal(fragment, diagnostic.range);

        if (range.start.line < 0) {
            const is$$PropsError =
                isAfterSvelte2TsxPropsReturn(
                    fragment.text,
                    fragment.offsetAt(diagnostic.range.start)
                ) && diagnostic.message.includes('$$Props');

            if (is$$PropsError) {
                const propsStart = regexIndexOf(
                    document.getText(),
                    /(interface|type)\s+\$\$Props[\s{=]/
                );

                if (propsStart) {
                    const start = document.positionAt(
                        propsStart + document.getText().substring(propsStart).indexOf('$$Props')
                    );
                    range = {
                        start,
                        end: { ...start, character: start.character + '$$Props'.length }
                    };
                }
            }
        }

        if (
            useNewTransformation &&
            [DiagnosticCode.MISSING_PROP, DiagnosticCode.MISSING_PROPS].includes(
                diagnostic.code as number
            ) &&
            !hasNonZeroRange({ range })
        ) {
            const node = getNodeIfIsInStartTag(document.html, document.offsetAt(range.start));
            if (node) {
                // This is a "some prop missing" error on a component -> remap
                range.start = document.positionAt(node.start + 1);
                range.end = document.positionAt(node.start + 1 + (node.tag?.length || 1));
            }
        }

        return { ...diagnostic, range };
    };
}

function findDiagnosticNode(diagnostic: ts.Diagnostic) {
    const { file, start, length } = diagnostic;
    if (!file || !start || !length) {
        return;
    }
    const span = { start, length };
    return findNodeAtSpan(file, span);
}

function copyDiagnosticAndChangeNode(diagnostic: ts.Diagnostic) {
    return (node: ts.Node) => ({
        ...diagnostic,
        start: node.getStart(),
        length: node.getWidth()
    });
}

/**
 * In some rare cases mapping of diagnostics does not work and produces negative lines.
 * We filter out these diagnostics with negative lines because else the LSP
 * apparently has a hickup and does not show any diagnostics at all.
 */
function hasNoNegativeLines(diagnostic: Diagnostic): boolean {
    return diagnostic.range.start.line >= 0 && diagnostic.range.end.line >= 0;
}

function isNoFalsePositive(
    useNewTransformation: boolean,
    document: Document,
    tsDoc: SvelteDocumentSnapshot
) {
    const text = document.getText();
    const usesPug = document.getLanguageAttribute('template') === 'pug';

    return (diagnostic: Diagnostic) => {
        if (
            useNewTransformation &&
            [DiagnosticCode.MULTIPLE_PROPS_SAME_NAME, DiagnosticCode.DUPLICATE_IDENTIFIER].includes(
                diagnostic.code as number
            )
        ) {
            const node = tsDoc.svelteNodeAt(diagnostic.range.start);
            if (isAttributeName(node, 'Element') || isEventHandler(node, 'Element')) {
                return false;
            }
        }

        return (
            isNoJsxCannotHaveMultipleAttrsError(diagnostic) &&
            isNoUsedBeforeAssigned(diagnostic, text, tsDoc) &&
            (!usesPug || isNoPugFalsePositive(diagnostic, document))
        );
    };
}

/**
 * All diagnostics inside the template tag and the unused import/variable diagnostics
 * are marked as false positive.
 */
function isNoPugFalsePositive(diagnostic: Diagnostic, document: Document): boolean {
    return (
        !isRangeInTag(diagnostic.range, document.templateInfo) &&
        diagnostic.code !== DiagnosticCode.NEVER_READ &&
        diagnostic.code !== DiagnosticCode.ALL_IMPORTS_UNUSED
    );
}

/**
 * Variable used before being assigned, can happen when  you do `export let x`
 * without assigning a value in strict mode. Should not throw an error here
 * but on the component-user-side ("you did not set a required prop").
 */
function isNoUsedBeforeAssigned(
    diagnostic: Diagnostic,
    text: string,
    tsDoc: SvelteDocumentSnapshot
): boolean {
    if (diagnostic.code !== DiagnosticCode.USED_BEFORE_ASSIGNED) {
        return true;
    }

    return !tsDoc.hasProp(getTextInRange(diagnostic.range, text));
}

/**
 * Jsx cannot have multiple attributes with same name,
 * but that's allowed for svelte
 */
function isNoJsxCannotHaveMultipleAttrsError(diagnostic: Diagnostic) {
    return diagnostic.code !== DiagnosticCode.DUPLICATED_JSX_ATTRIBUTES;
}

/**
 * Some diagnostics have JSX-specific nomenclature. Enhance them for more clarity.
 */
function enhanceIfNecessary(diagnostic: Diagnostic): Diagnostic {
    if (
        diagnostic.code === DiagnosticCode.CANNOT_BE_USED_AS_JSX_COMPONENT ||
        (diagnostic.code === DiagnosticCode.TYPE_X_NOT_ASSIGNABLE_TO_TYPE_Y &&
            diagnostic.message.includes('ConstructorOfATypedSvelteComponent'))
    ) {
        return {
            ...diagnostic,
            message:
                diagnostic.message +
                '\n\nPossible causes:\n' +
                '- You use the instance type of a component where you should use the constructor type\n' +
                '- Type definitions are missing for this Svelte Component. ' +
                'If you are using Svelte 3.31+, use SvelteComponentTyped to add a definition:\n' +
                '  import type { SvelteComponentTyped } from "svelte";\n' +
                '  class ComponentName extends SvelteComponentTyped<{propertyName: string;}> {}'
        };
    }

    if (diagnostic.code === DiagnosticCode.JSX_ELEMENT_DOES_NOT_SUPPORT_ATTRIBUTES) {
        return {
            ...diagnostic,
            message:
                'Element does not support attributes because ' +
                'type definitions are missing for this Svelte Component or element cannot be used as such.\n\n' +
                'Underlying error:\n' +
                diagnostic.message
        };
    }

    if (diagnostic.code === DiagnosticCode.MODIFIERS_CANNOT_APPEAR_HERE) {
        return {
            ...diagnostic,
            message:
                diagnostic.message +
                '\nIf this is a declare statement, move it into <script context="module">..</script>'
        };
    }

    return diagnostic;
}

/**
 * Due to source mapping, some ranges may be swapped: Start is end. Swap back in this case.
 */
function swapDiagRangeStartEndIfNecessary(diag: Diagnostic): Diagnostic {
    diag.range = swapRangeStartEndIfNecessary(diag.range);
    return diag;
}

/**
 * Checks if diagnostic is not within a section that should be completely ignored
 * because it's purely generated.
 */
function isNotGenerated(text: string) {
    return (diagnostic: ts.Diagnostic) => {
        if (diagnostic.start === undefined || diagnostic.length === undefined) {
            return true;
        }
        return !isInGeneratedCode(text, diagnostic.start, diagnostic.start + diagnostic.length);
    };
}

function isUnusedReactiveStatementLabel(diagnostic: ts.Diagnostic) {
    if (diagnostic.code !== DiagnosticCode.UNUSED_LABEL) {
        return false;
    }

    const diagNode = findDiagnosticNode(diagnostic);
    if (!diagNode) {
        return false;
    }

    // TS warning targets the identifier
    if (!ts.isIdentifier(diagNode)) {
        return false;
    }

    if (!diagNode.parent) {
        return false;
    }
    return isReactiveStatement(diagNode.parent);
}

/**
 * Checks if diagnostics should be ignored because they report an unused expression* in
 * a reactive statement, and those actually have side effects in Svelte (hinting deps).
 *
 *     $: x, update()
 *
 * Only `let` (i.e. reactive) variables are ignored. For the others, new diagnostics are
 * emitted, centered on the (non reactive) identifiers in the initial warning.
 */
function resolveNoopsInReactiveStatements(lang: ts.LanguageService, diagnostics: ts.Diagnostic[]) {
    const isLet = (file: ts.SourceFile) => (node: ts.Node) => {
        const defs = lang.getDefinitionAtPosition(file.fileName, node.getStart());
        return !!defs && defs.some((def) => def.fileName === file.fileName && def.kind === 'let');
    };

    const expandRemainingNoopWarnings = (diagnostic: ts.Diagnostic): void | ts.Diagnostic[] => {
        const { code, file } = diagnostic;

        // guard: missing info
        if (!file) {
            return;
        }

        // guard: not target error
        const isNoopDiag = code === DiagnosticCode.NOOP_IN_COMMAS;
        if (!isNoopDiag) {
            return;
        }

        const diagNode = findDiagnosticNode(diagnostic);
        if (!diagNode) {
            return;
        }

        if (!isInReactiveStatement(diagNode)) {
            return;
        }

        return (
            // for all identifiers in diagnostic node
            gatherIdentifiers(diagNode)
                // ignore `let` (i.e. reactive) variables
                .filter(not(isLet(file)))
                // and create targeted diagnostics just for the remaining ids
                .map(copyDiagnosticAndChangeNode(diagnostic))
        );
    };

    const expandedDiagnostics = flatten(passMap(diagnostics, expandRemainingNoopWarnings));
    return expandedDiagnostics.length === diagnostics.length
        ? expandedDiagnostics
        : // This can generate duplicate diagnostics
          expandedDiagnostics.filter(dedupDiagnostics());
}

function dedupDiagnostics() {
    const hashDiagnostic = (diag: ts.Diagnostic) =>
        [diag.start, diag.length, diag.category, diag.source, diag.code]
            .map((x) => JSON.stringify(x))
            .join(':');

    const known = new Set();

    return (diag: ts.Diagnostic) => {
        const key = hashDiagnostic(diag);
        if (known.has(key)) {
            return false;
        } else {
            known.add(key);
            return true;
        }
    };
}
