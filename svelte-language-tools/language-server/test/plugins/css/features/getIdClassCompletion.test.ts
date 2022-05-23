import assert from 'assert';
import { CompletionItem, CompletionItemKind, CompletionList } from 'vscode-languageserver';
import { Document, DocumentManager } from '../../../../src/lib/documents';
import { LSConfigManager } from '../../../../src/ls-config';
import { CSSPlugin } from '../../../../src/plugins';
import { CSSDocument } from '../../../../src/plugins/css/CSSDocument';
import {
    collectSelectors,
    NodeType,
    CSSNode
} from '../../../../src/plugins/css/features/getIdClassCompletion';

describe('getIdClassCompletion', () => {
    function createDocument(content: string) {
        return new Document('file:///hello.svelte', content);
    }

    function createCSSDocument(content: string) {
        return new CSSDocument(createDocument(content));
    }

    function testSelectors(items: CompletionItem[], expectedSelectors: string[]) {
        assert.deepStrictEqual(
            items.map((item) => item.label),
            expectedSelectors,
            'vscode-language-services might have changed the NodeType enum. Check if we need to update it'
        );
    }

    it('collect css classes', () => {
        const actual = collectSelectors(
            createCSSDocument('<style>.abc {}</style>').stylesheet as CSSNode,
            NodeType.ClassSelector
        );
        testSelectors(actual, ['abc']);
    });

    it('collect css ids', () => {
        const actual = collectSelectors(
            createCSSDocument('<style>#abc {}</style>').stylesheet as CSSNode,
            NodeType.IdentifierSelector
        );
        testSelectors(actual, ['abc']);
    });

    function setup(content: string) {
        const document = createDocument(content);
        const docManager = new DocumentManager(() => document);
        const pluginManager = new LSConfigManager();
        const plugin = new CSSPlugin(docManager, pluginManager);
        docManager.openDocument(<any>'some doc');
        return { plugin, document };
    }

    it('provides css classes completion for class attribute', () => {
        const { plugin, document } = setup('<div class=></div><style>.abc{}</style>');
        assert.deepStrictEqual(plugin.getCompletions(document, { line: 0, character: 11 }), {
            isIncomplete: false,
            items: [{ label: 'abc', kind: CompletionItemKind.Keyword }]
        } as CompletionList);
    });

    it('provides css classes completion for class directive', () => {
        const { plugin, document } = setup('<div class:></div><style>.abc{}</style>');
        assert.deepStrictEqual(plugin.getCompletions(document, { line: 0, character: 11 }), {
            isIncomplete: false,
            items: [{ label: 'abc', kind: CompletionItemKind.Keyword }]
        } as CompletionList);
    });

    it('provides css id completion for id attribute', () => {
        const { plugin, document } = setup('<div id=></div><style>#abc{}</style>');
        assert.deepStrictEqual(plugin.getCompletions(document, { line: 0, character: 8 }), {
            isIncomplete: false,
            items: [{ label: 'abc', kind: CompletionItemKind.Keyword }]
        } as CompletionList);
    });
});
