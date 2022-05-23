import { Warning } from 'svelte/types/compiler/interfaces';
import { Diagnostic, DiagnosticSeverity, Position, Range } from 'vscode-languageserver';
import {
    Document,
    isInTag,
    mapObjWithRangeToOriginal,
    TagInformation
} from '../../../lib/documents';
import { Logger } from '../../../logger';
import { CompilerWarningsSettings } from '../../../ls-config';
import { getLastPartOfPath, moveRangeStartToEndIfNecessary } from '../../../utils';
import { SvelteDocument, TranspileErrorSource } from '../SvelteDocument';

/**
 * Returns diagnostics from the svelte compiler.
 * Also tries to return errors at correct position if transpilation/preprocessing fails.
 */
export async function getDiagnostics(
    document: Document,
    svelteDoc: SvelteDocument,
    settings: CompilerWarningsSettings
): Promise<Diagnostic[]> {
    const config = await svelteDoc.config;
    if (config?.loadConfigError) {
        return getConfigLoadErrorDiagnostics(config.loadConfigError);
    }

    try {
        return await tryGetDiagnostics(document, svelteDoc, settings);
    } catch (error) {
        return getPreprocessErrorDiagnostics(document, error);
    }
}

/**
 * Try to transpile and compile the svelte file and return diagnostics.
 */
async function tryGetDiagnostics(
    document: Document,
    svelteDoc: SvelteDocument,
    settings: CompilerWarningsSettings
): Promise<Diagnostic[]> {
    const transpiled = await svelteDoc.getTranspiled();

    try {
        const res = await svelteDoc.getCompiled();
        return (((res.stats as any).warnings || res.warnings || []) as Warning[])
            .filter((warning) => settings[warning.code] !== 'ignore')
            .map((warning) => {
                const start = warning.start || { line: 1, column: 0 };
                const end = warning.end || start;
                return {
                    range: Range.create(start.line - 1, start.column, end.line - 1, end.column),
                    message: warning.message,
                    severity:
                        settings[warning.code] === 'error'
                            ? DiagnosticSeverity.Error
                            : DiagnosticSeverity.Warning,
                    source: 'svelte',
                    code: warning.code
                };
            })
            .map((diag) => mapObjWithRangeToOriginal(transpiled, diag))
            .map((diag) => adjustMappings(diag, document))
            .filter((diag) => isNoFalsePositive(diag, document));
    } catch (err) {
        return (await createParserErrorDiagnostic(err, document))
            .map((diag) => mapObjWithRangeToOriginal(transpiled, diag))
            .map((diag) => adjustMappings(diag, document));
    }
}

/**
 * Try to infer a nice diagnostic error message from the compilation error.
 */
async function createParserErrorDiagnostic(error: any, document: Document) {
    const start = error.start || { line: 1, column: 0 };
    const end = error.end || start;
    const diagnostic: Diagnostic = {
        range: Range.create(start.line - 1, start.column, end.line - 1, end.column),
        message: error.message,
        severity: DiagnosticSeverity.Error,
        source: 'svelte',
        code: error.code
    };

    if (diagnostic.message.includes('expected')) {
        const isInStyle = isInTag(diagnostic.range.start, document.styleInfo);
        const isInScript = isInTag(
            diagnostic.range.start,
            document.scriptInfo || document.moduleScriptInfo
        );

        if (isInStyle || isInScript) {
            diagnostic.message +=
                '\n\nIf you expect this syntax to work, here are some suggestions: ';
            if (isInScript) {
                diagnostic.message +=
                    '\nIf you use typescript with `svelte-preprocess`, did you add `lang="ts"` to your `script` tag? ';
            } else {
                diagnostic.message +=
                    '\nIf you use less/SCSS with `svelte-preprocess`, did you add `lang="scss"`/`lang="less"` to your `style` tag? ' +
                    scssNodeRuntimeHint;
            }
            diagnostic.message +=
                '\nDid you setup a `svelte.config.js`? ' +
                '\nSee https://github.com/sveltejs/language-tools/tree/master/docs#using-with-preprocessors for more info.';
        }
    }

    return [diagnostic];
}

/**
 * Try to infer a nice diagnostic error message from the transpilation error.
 */
function getPreprocessErrorDiagnostics(document: Document, error: any): Diagnostic[] {
    Logger.error('Preprocessing failed');
    Logger.error(error);

    if (document.styleInfo && error.__source === TranspileErrorSource.Style) {
        return getStyleErrorDiagnostics(error, document);
    }

    if (
        (document.scriptInfo || document.moduleScriptInfo) &&
        error.__source === TranspileErrorSource.Script
    ) {
        return getScriptErrorDiagnostics(error, document);
    }

    return getOtherErrorDiagnostics(error);
}

function getConfigLoadErrorDiagnostics(error: any): Diagnostic[] {
    return [
        {
            message: 'Error in svelte.config.js\n\n' + error,
            range: Range.create(Position.create(0, 0), Position.create(0, 5)),
            severity: DiagnosticSeverity.Error,
            source: 'svelte'
        }
    ];
}

/**
 * Try to infer a nice diagnostic error message from the transpilation error.
 */
function getStyleErrorDiagnostics(error: any, document: Document): Diagnostic[] {
    // Error could be from another file that was mixed into the Svelte file as part of preprocessing.
    // Some preprocessors set the file property from which we can infer that
    const isErrorFromOtherFile =
        typeof error?.file === 'string' &&
        getLastPartOfPath(error.file) !== getLastPartOfPath(document.getFilePath() || '');

    return [
        {
            message: getStyleErrorMessage(),
            range: getStyleErrorRange(),
            severity: DiagnosticSeverity.Error,
            source: 'svelte(style)'
        }
    ];

    function getStyleErrorMessage() {
        if (isSveltePreprocessCannotFindModulesError(error)) {
            const hint = error.message.includes('node-sass') ? scssNodeRuntimeHint : '';
            return getErrorMessage(error.message, 'style', hint);
        }

        const msg =
            error.formatted /* sass error messages have this */ ||
            error.message ||
            'Style error. Transpilation failed.';
        return isErrorFromOtherFile ? 'Error in referenced file\n\n' + msg : msg;
    }

    function getStyleErrorRange() {
        const lineOffset = document.styleInfo?.startPos.line || 0;
        const position =
            !isErrorFromOtherFile &&
            // Some preprocessors like sass or less return error objects with these attributes.
            // Use it to display message at better position.
            typeof error?.column === 'number' &&
            typeof error?.line === 'number'
                ? Position.create(lineOffset + error.line - 1, error.column)
                : document.styleInfo?.startPos || Position.create(0, 0);
        return Range.create(position, position);
    }
}

/**
 * Try to infer a nice diagnostic error message from the transpilation error.
 */
function getScriptErrorDiagnostics(error: any, document: Document): Diagnostic[] {
    return [
        {
            message: getScriptErrorMessage(),
            range: getScriptErrorRange(),
            severity: DiagnosticSeverity.Error,
            source: 'svelte(script)'
        }
    ];

    function getScriptErrorMessage() {
        if (isSveltePreprocessCannotFindModulesError(error)) {
            return getErrorMessage(error.message, 'script');
        }

        return error.message || 'Script error. Transpilation failed.';
    }

    function getScriptErrorRange() {
        const position =
            document.scriptInfo?.startPos ||
            document.moduleScriptInfo?.startPos ||
            Position.create(0, 0);
        return Range.create(position, position);
    }
}

/**
 * Try to infer a nice diagnostic error message from the transpilation error.
 */
function getOtherErrorDiagnostics(error: any): Diagnostic[] {
    return [
        {
            message: getOtherErrorMessage(),
            range: Range.create(Position.create(0, 0), Position.create(0, 5)),
            severity: DiagnosticSeverity.Warning,
            source: 'svelte'
        }
    ];

    function getOtherErrorMessage() {
        if (isSveltePreprocessCannotFindModulesError(error)) {
            return getErrorMessage(error.message, 'it');
        }

        return error.message || 'Error. Transpilation failed.';
    }
}

/**
 * Preprocessing could fail if packages cannot be resolved.
 * A warning about a broken svelte.configs.js/preprocessor setup should be added then.
 */
function isSveltePreprocessCannotFindModulesError(error: any): error is Error {
    return error instanceof Error && error.message.startsWith('Cannot find any of modules');
}

function getErrorMessage(error: any, source: string, hint = '') {
    return (
        error +
        '\n\nThe file cannot be parsed because ' +
        source +
        " requires a preprocessor that doesn't seem to be setup or failed during setup. " +
        'Did you setup a `svelte.config.js`? ' +
        hint +
        '\n\nSee https://github.com/sveltejs/language-tools/tree/master/docs#using-with-preprocessors for more info.'
    );
}

function isNoFalsePositive(diag: Diagnostic, doc: Document): boolean {
    if (diag.code !== 'unused-export-let') {
        return true;
    }

    // TypeScript transpiles `export enum A` and `export namespace A` to `export var A`,
    // which the compiler will warn about.
    // Silence this edge case. We extract the property from the message and don't use the position
    // because that position could be wrong when source mapping trips up.
    const unusedExportName = diag.message.substring(
        diag.message.indexOf("'") + 1,
        diag.message.lastIndexOf("'")
    );
    const hasExportedEnumWithThatName = new RegExp(
        `\\bexport\\s+?(enum|namespace)\\s+?${unusedExportName}\\b`
    ).test(doc.getText());
    return !hasExportedEnumWithThatName;
}

/**
 * Some mappings might be invalid. Try to catch these cases here.
 */
function adjustMappings(diag: Diagnostic, doc: Document): Diagnostic {
    if (diag.range.start.character < 0) {
        diag.range.start.character = 0;
    }
    if (diag.range.end.character < 0) {
        diag.range.end.character = 0;
    }
    if (diag.range.start.line < 0) {
        diag.range.start = { line: 0, character: 0 };
    }
    if (diag.range.end.line < 0) {
        diag.range.end = { line: 0, character: 0 };
    }
    diag.range = moveRangeStartToEndIfNecessary(diag.range);

    if (
        diag.code === 'css-unused-selector' &&
        doc.styleInfo &&
        !isInTag(diag.range.start, doc.styleInfo)
    ) {
        diag.range.start = (doc.styleInfo as TagInformation).startPos;
        diag.range.end = diag.range.start;
    }

    return diag;
}

const scssNodeRuntimeHint =
    'If you use SCSS, it may be necessary to add the path to your NODE runtime to the setting `svelte.language-server.runtime`, or use `sass` instead of `node-sass`. ';
