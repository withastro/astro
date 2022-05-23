import ts from 'typescript';
import { Position } from 'vscode-languageserver';
import {
    Document,
    getLineAtPosition,
    getNodeIfIsInComponentStartTag,
    isInTag
} from '../../../lib/documents';
import { ComponentInfoProvider, JsOrTsComponentInfoProvider } from '../ComponentInfoProvider';
import { DocumentSnapshot, SnapshotFragment, SvelteDocumentSnapshot } from '../DocumentSnapshot';
import { LSAndTSDocResolver } from '../LSAndTSDocResolver';
import { or } from '../../../utils';

type NodePredicate = (node: ts.Node) => boolean;

type NodeTypePredicate<T extends ts.Node> = (node: ts.Node) => node is T;

/**
 * If the given original position is within a Svelte starting tag,
 * return the snapshot of that component.
 */
export function getComponentAtPosition(
    lang: ts.LanguageService,
    doc: Document,
    tsDoc: SvelteDocumentSnapshot,
    originalPosition: Position
): ComponentInfoProvider | null {
    if (tsDoc.parserError) {
        return null;
    }

    if (
        isInTag(originalPosition, doc.scriptInfo) ||
        isInTag(originalPosition, doc.moduleScriptInfo)
    ) {
        // Inside script tags -> not a component
        return null;
    }

    const node = getNodeIfIsInComponentStartTag(doc.html, doc.offsetAt(originalPosition));
    if (!node) {
        return null;
    }

    const fragment = tsDoc.getFragment();
    const generatedPosition = fragment.getGeneratedPosition(doc.positionAt(node.start + 1));
    const def = lang.getDefinitionAtPosition(
        tsDoc.filePath,
        fragment.offsetAt(generatedPosition)
    )?.[0];
    if (!def) {
        return null;
    }

    return JsOrTsComponentInfoProvider.create(lang, def);
}

export function isComponentAtPosition(
    doc: Document,
    tsDoc: SvelteDocumentSnapshot,
    originalPosition: Position
): boolean {
    if (tsDoc.parserError) {
        return false;
    }

    if (
        isInTag(originalPosition, doc.scriptInfo) ||
        isInTag(originalPosition, doc.moduleScriptInfo)
    ) {
        // Inside script tags -> not a component
        return false;
    }

    return !!getNodeIfIsInComponentStartTag(doc.html, doc.offsetAt(originalPosition));
}

/**
 * Checks if this a section that should be completely ignored
 * because it's purely generated.
 */
export function isInGeneratedCode(text: string, start: number, end: number = start) {
    const lastStart = text.lastIndexOf('/*Ωignore_startΩ*/', start);
    const lastEnd = text.lastIndexOf('/*Ωignore_endΩ*/', start);
    const nextEnd = text.indexOf('/*Ωignore_endΩ*/', end);
    // if lastEnd === nextEnd, this means that the str was found at the index
    // up to which is searched for it
    return (lastStart > lastEnd || lastEnd === nextEnd) && lastStart < nextEnd;
}

/**
 * Checks that this isn't a text span that should be completely ignored
 * because it's purely generated.
 */
export function isNoTextSpanInGeneratedCode(text: string, span: ts.TextSpan) {
    return !isInGeneratedCode(text, span.start, span.start + span.length);
}

export function isPartOfImportStatement(text: string, position: Position): boolean {
    const line = getLineAtPosition(position, text);
    return /\s*from\s+["'][^"']*/.test(line.slice(0, position.character));
}

export class SnapshotFragmentMap {
    private map = new Map<string, { fragment: SnapshotFragment; snapshot: DocumentSnapshot }>();
    constructor(private resolver: LSAndTSDocResolver) {}

    set(fileName: string, content: { fragment: SnapshotFragment; snapshot: DocumentSnapshot }) {
        this.map.set(fileName, content);
    }

    get(fileName: string) {
        return this.map.get(fileName);
    }

    getFragment(fileName: string) {
        return this.map.get(fileName)?.fragment;
    }

    async retrieve(fileName: string) {
        let snapshotFragment = this.get(fileName);
        if (!snapshotFragment) {
            const snapshot = await this.resolver.getSnapshot(fileName);
            const fragment = await snapshot.getFragment();
            snapshotFragment = { fragment, snapshot };
            this.set(fileName, snapshotFragment);
        }
        return snapshotFragment;
    }

    async retrieveFragment(fileName: string) {
        return (await this.retrieve(fileName)).fragment;
    }
}

export function isAfterSvelte2TsxPropsReturn(text: string, end: number) {
    const textBeforeProp = text.substring(0, end);
    // This is how svelte2tsx writes out the props
    if (textBeforeProp.includes('\nreturn { props: {')) {
        return true;
    }
}

export function findContainingNode<T extends ts.Node>(
    node: ts.Node,
    textSpan: ts.TextSpan,
    predicate: (node: ts.Node) => node is T
): T | undefined {
    const children = node.getChildren();
    const end = textSpan.start + textSpan.length;

    for (const child of children) {
        if (!(child.getStart() <= textSpan.start && child.getEnd() >= end)) {
            continue;
        }

        if (predicate(child)) {
            return child;
        }

        const foundInChildren = findContainingNode(child, textSpan, predicate);
        if (foundInChildren) {
            return foundInChildren;
        }
    }
}

/**
 * Finds node exactly matching span {start, length}.
 */
export function findNodeAtSpan<T extends ts.Node>(
    node: ts.Node,
    span: { start: number; length: number },
    predicate?: NodeTypePredicate<T>
): T | void {
    const { start, length } = span;

    const end = start + length;

    for (const child of node.getChildren()) {
        const childStart = child.getStart();
        if (end <= childStart) {
            return;
        }

        const childEnd = child.getEnd();
        if (start >= childEnd) {
            continue;
        }

        if (start === childStart && end === childEnd) {
            if (!predicate) {
                return child as T;
            }
            if (predicate(child)) {
                return child;
            }
        }

        const foundInChildren = findNodeAtSpan(child, span, predicate);
        if (foundInChildren) {
            return foundInChildren;
        }
    }
}

function isSomeAncestor(node: ts.Node, predicate: NodePredicate) {
    for (let parent = node.parent; parent; parent = parent.parent) {
        if (predicate(parent)) {
            return true;
        }
    }
    return false;
}

/**
 * Tests a node then its parent and successive ancestors for some respective predicates.
 */
function nodeAndParentsSatisfyRespectivePredicates<T extends ts.Node>(
    selfPredicate: NodePredicate | NodeTypePredicate<T>,
    ...predicates: NodePredicate[]
) {
    return (node: ts.Node | undefined | void | null): node is T => {
        let next = node;
        return [selfPredicate, ...predicates].every((predicate) => {
            if (!next) {
                return false;
            }
            const current = next;
            next = next.parent;
            return predicate(current);
        });
    };
}

const isRenderFunction = nodeAndParentsSatisfyRespectivePredicates<
    ts.FunctionDeclaration & { name: ts.Identifier }
>((node) => ts.isFunctionDeclaration(node) && node?.name?.getText() === 'render', ts.isSourceFile);

const isRenderFunctionBody = nodeAndParentsSatisfyRespectivePredicates(
    ts.isBlock,
    isRenderFunction
);

export const isReactiveStatement = nodeAndParentsSatisfyRespectivePredicates<ts.LabeledStatement>(
    (node) => ts.isLabeledStatement(node) && node.label.getText() === '$',
    or(
        // function render() {
        //     $: x2 = __sveltets_1_invalidate(() => x * x)
        // }
        isRenderFunctionBody,
        // function render() {
        //     ;() => {$: x, update();
        // }
        nodeAndParentsSatisfyRespectivePredicates(
            ts.isBlock,
            ts.isArrowFunction,
            ts.isExpressionStatement,
            isRenderFunctionBody
        )
    )
);

export const isInReactiveStatement = (node: ts.Node) => isSomeAncestor(node, isReactiveStatement);

function gatherDescendants<T extends ts.Node>(
    node: ts.Node,
    predicate: NodePredicate | NodeTypePredicate<T>,
    dest: T[] = []
) {
    if (predicate(node)) {
        dest.push(node);
    } else {
        for (const child of node.getChildren()) {
            gatherDescendants(child, predicate, dest);
        }
    }
    return dest;
}

export const gatherIdentifiers = (node: ts.Node) => gatherDescendants(node, ts.isIdentifier);
