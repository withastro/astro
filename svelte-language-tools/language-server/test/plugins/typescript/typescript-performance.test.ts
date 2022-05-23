import * as path from 'path';
import { performance } from 'perf_hooks';
import ts from 'typescript';
import { Position, Range } from 'vscode-languageserver';
import { Document, DocumentManager } from '../../../src/lib/documents';
import { LSConfigManager } from '../../../src/ls-config';
import { LSAndTSDocResolver, TypeScriptPlugin } from '../../../src/plugins';
import { pathToUrl } from '../../../src/utils';

describe('TypeScript Plugin Performance Tests', () => {
    function setup(filename: string) {
        const docManager = new DocumentManager(() => document);
        const testDir = path.join(__dirname, 'testfiles');
        const filePath = path.join(testDir, filename);
        const uri = pathToUrl(filePath);
        const document = new Document(uri, ts.sys.readFile(filePath) || '');
        const pluginManager = new LSConfigManager();
        const plugin = new TypeScriptPlugin(
            pluginManager,
            new LSAndTSDocResolver(docManager, [pathToUrl(testDir)], pluginManager)
        );
        docManager.openDocument({ uri, text: document.getText() });
        const append = (newText: string) =>
            docManager.updateDocument({ uri, version: 1 }, [
                { range: Range.create(Position.create(9, 0), Position.create(9, 0)), text: newText }
            ]);
        const prepend = (newText: string) =>
            docManager.updateDocument({ uri, version: 1 }, [
                { range: Range.create(Position.create(1, 0), Position.create(1, 0)), text: newText }
            ]);
        return { plugin, document, append, prepend };
    }

    it('should be fast enough', async () => {
        const { document, plugin, append, prepend } = setup('performance.svelte');

        const start = performance.now();
        for (let i = 0; i < 100; i++) {
            const position = Position.create(Math.floor(i / 2) + 1, 15);
            await plugin.doHover(document, position);
            await plugin.getDiagnostics(document);
            await plugin.findReferences(document, position, {
                includeDeclaration: true
            });
            await plugin.getDocumentSymbols(document);
            await plugin.getSemanticTokens(document);
            await plugin.prepareRename(document, position);
            if (i % 2) {
                prepend('function asd() {}\n');
            } else {
                append('function asd() {}\n');
            }
        }
        const end = performance.now();

        console.log(`Performance test took ${end - start}ms`);
    }).timeout(15000);
});
