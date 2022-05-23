import { walk } from 'estree-walker';
import { EOL } from 'os';
import { Ast } from 'svelte/types/compiler/interfaces';
import {
    CodeAction,
    CodeActionKind,
    Diagnostic,
    DiagnosticSeverity,
    OptionalVersionedTextDocumentIdentifier,
    Position,
    TextDocumentEdit,
    TextEdit
} from 'vscode-languageserver';
import {
    getLineOffsets,
    mapObjWithRangeToOriginal,
    offsetAt,
    positionAt
} from '../../../../lib/documents';
import { getIndent, pathToUrl } from '../../../../utils';
import { SvelteDocument } from '../../SvelteDocument';
import ts from 'typescript';
// estree does not have start/end in their public Node interface,
// but the AST returned by svelte/compiler does. Type as any as a workaround.
type Node = any;

/**
 * Get applicable quick fixes.
 */
export async function getQuickfixActions(
    svelteDoc: SvelteDocument,
    svelteDiagnostics: Diagnostic[]
) {
    const { ast } = await svelteDoc.getCompiled();

    return Promise.all(
        svelteDiagnostics.map(
            async (diagnostic) => await createQuickfixAction(diagnostic, svelteDoc, ast)
        )
    );
}

async function createQuickfixAction(
    diagnostic: Diagnostic,
    svelteDoc: SvelteDocument,
    ast: Ast
): Promise<CodeAction> {
    const textDocument = OptionalVersionedTextDocumentIdentifier.create(
        pathToUrl(svelteDoc.getFilePath()),
        null
    );

    return CodeAction.create(
        getCodeActionTitle(diagnostic),
        {
            documentChanges: [
                TextDocumentEdit.create(textDocument, [
                    await getSvelteIgnoreEdit(svelteDoc, ast, diagnostic)
                ])
            ]
        },
        CodeActionKind.QuickFix
    );
}

function getCodeActionTitle(diagnostic: Diagnostic) {
    // make it distinguishable with eslint's code action
    return `(svelte) Disable ${diagnostic.code} for this line`;
}

/**
 * Whether or not the given diagnostic can be ignored via a
 * <!-- svelte-ignore <code> -->
 */
export function isIgnorableSvelteDiagnostic(diagnostic: Diagnostic) {
    const { source, severity, code } = diagnostic;
    return (
        code &&
        !nonIgnorableWarnings.includes(<string>code) &&
        source === 'svelte' &&
        severity !== DiagnosticSeverity.Error
    );
}
const nonIgnorableWarnings = [
    'missing-custom-element-compile-options',
    'unused-export-let',
    'css-unused-selector'
];

async function getSvelteIgnoreEdit(svelteDoc: SvelteDocument, ast: Ast, diagnostic: Diagnostic) {
    const {
        code,
        range: { start, end }
    } = diagnostic;
    const transpiled = await svelteDoc.getTranspiled();
    const content = transpiled.getText();
    const lineOffsets = getLineOffsets(content);
    const { html } = ast;
    const generatedStart = transpiled.getGeneratedPosition(start);
    const generatedEnd = transpiled.getGeneratedPosition(end);

    const diagnosticStartOffset = offsetAt(generatedStart, content, lineOffsets);
    const diagnosticEndOffset = offsetAt(generatedEnd, content, lineOffsets);
    const offsetRange: ts.TextRange = {
        pos: diagnosticStartOffset,
        end: diagnosticEndOffset
    };

    const node = findTagForRange(html, offsetRange);

    const nodeStartPosition = positionAt(node.start, content, lineOffsets);
    const nodeLineStart = offsetAt(
        {
            line: nodeStartPosition.line,
            character: 0
        },
        content,
        lineOffsets
    );
    const afterStartLineStart = content.slice(nodeLineStart);
    const indent = getIndent(afterStartLineStart);

    // TODO: Make all code action's new line consistent
    const ignore = `${indent}<!-- svelte-ignore ${code} -->${EOL}`;
    const position = Position.create(nodeStartPosition.line, 0);

    return mapObjWithRangeToOriginal(transpiled, TextEdit.insert(position, ignore));
}

const elementOrComponent = ['Component', 'Element', 'InlineComponent'];

function findTagForRange(html: Node, range: ts.TextRange) {
    let nearest = html;

    walk(html, {
        enter(node, parent) {
            const { type } = node;
            const isBlock = 'block' in node || node.type.toLowerCase().includes('block');
            const isFragment = type === 'Fragment';
            const keepLooking = isFragment || elementOrComponent.includes(type) || isBlock;
            if (!keepLooking) {
                this.skip();
                return;
            }

            if (within(node, range) && parent === nearest) {
                nearest = node;
            }
        }
    });

    return nearest;
}

function within(node: Node, range: ts.TextRange) {
    return node.end >= range.end && node.start <= range.pos;
}
