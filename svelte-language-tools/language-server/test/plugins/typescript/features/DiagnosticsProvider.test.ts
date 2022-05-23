import * as assert from 'assert';
import { existsSync, unlinkSync, writeFileSync } from 'fs';
import * as path from 'path';
import ts from 'typescript';
import { Document, DocumentManager } from '../../../../src/lib/documents';
import { LSConfigManager } from '../../../../src/ls-config';
import { DiagnosticsProviderImpl } from '../../../../src/plugins/typescript/features/DiagnosticsProvider';
import { LSAndTSDocResolver } from '../../../../src/plugins/typescript/LSAndTSDocResolver';
import { __resetCache } from '../../../../src/plugins/typescript/service';
import { normalizePath, pathToUrl } from '../../../../src/utils';

const testDir = path.join(__dirname, '..', 'testfiles', 'diagnostics');

describe('DiagnosticsProvider', () => {
    function setup(filename: string) {
        const docManager = new DocumentManager(
            (textDocument) => new Document(textDocument.uri, textDocument.text)
        );
        const lsAndTsDocResolver = new LSAndTSDocResolver(
            docManager,
            [pathToUrl(testDir)],
            new LSConfigManager()
        );
        const plugin = new DiagnosticsProviderImpl(lsAndTsDocResolver, new LSConfigManager());
        const filePath = path.join(testDir, filename);
        const document = docManager.openDocument(<any>{
            uri: pathToUrl(filePath),
            text: ts.sys.readFile(filePath) || ''
        });
        return { plugin, document, docManager, lsAndTsDocResolver };
    }

    it('notices creation and deletion of imported module', async () => {
        const { plugin, document, lsAndTsDocResolver } = setup('unresolvedimport.svelte');

        const diagnostics1 = await plugin.getDiagnostics(document);
        assert.deepStrictEqual(diagnostics1.length, 1);

        // back-and-forth-conversion normalizes slashes
        const newFilePath = normalizePath(path.join(testDir, 'doesntexistyet.js')) || '';
        writeFileSync(newFilePath, 'export default function foo() {}');
        assert.ok(existsSync(newFilePath));
        await lsAndTsDocResolver.getSnapshot(newFilePath);

        try {
            const diagnostics2 = await plugin.getDiagnostics(document);
            assert.deepStrictEqual(diagnostics2.length, 0);
            await lsAndTsDocResolver.deleteSnapshot(newFilePath);
        } finally {
            unlinkSync(newFilePath);
        }

        const diagnostics3 = await plugin.getDiagnostics(document);
        assert.deepStrictEqual(diagnostics3.length, 1);
    }).timeout(5000);

    it('notices update of imported module', async () => {
        const { plugin, document, lsAndTsDocResolver } = setup(
            'diagnostics-imported-js-update.svelte'
        );

        const newFilePath = normalizePath(path.join(testDir, 'empty-export.ts')) || '';
        await lsAndTsDocResolver.getSnapshot(newFilePath);

        const diagnostics1 = await plugin.getDiagnostics(document);
        assert.deepStrictEqual(
            diagnostics1[0]?.message,
            "Module '\"./empty-export\"' has no exported member 'foo'."
        );

        await lsAndTsDocResolver.updateExistingTsOrJsFile(newFilePath, [
            {
                range: { start: { line: 0, character: 0 }, end: { line: 0, character: 0 } },
                text: 'export function foo() {}'
            }
        ]);

        const diagnostics2 = await plugin.getDiagnostics(document);
        assert.deepStrictEqual(diagnostics2.length, 0);
        await lsAndTsDocResolver.deleteSnapshot(newFilePath);
    }).timeout(5000);

    it('notices file changes in all services that reference that file', async () => {
        // Hacky but ensures that this tests is not interfered with by other tests
        // which could make it fail.
        __resetCache();
        const { plugin, document, docManager, lsAndTsDocResolver } = setup(
            'different-ts-service.svelte'
        );
        const otherFilePath = path.join(
            testDir,
            'different-ts-service',
            'different-ts-service.svelte'
        );
        const otherDocument = docManager.openDocument(<any>{
            uri: pathToUrl(otherFilePath),
            text: ts.sys.readFile(otherFilePath) || ''
        });
        // needed because tests have nasty dependencies between them. The ts service
        // is cached and knows the docs already
        const sharedFilePath = path.join(testDir, 'shared-comp.svelte');
        docManager.openDocument(<any>{
            uri: pathToUrl(sharedFilePath),
            text: ts.sys.readFile(sharedFilePath) || ''
        });

        const diagnostics1 = await plugin.getDiagnostics(document);
        assert.deepStrictEqual(diagnostics1.length, 2);
        const diagnostics2 = await plugin.getDiagnostics(otherDocument);
        assert.deepStrictEqual(diagnostics2.length, 2);

        docManager.updateDocument(
            { uri: pathToUrl(path.join(testDir, 'shared-comp.svelte')), version: 2 },
            [
                {
                    range: { start: { line: 1, character: 19 }, end: { line: 1, character: 19 } },
                    text: 'o'
                }
            ]
        );
        await lsAndTsDocResolver.updateExistingTsOrJsFile(path.join(testDir, 'shared-ts-file.ts'), [
            {
                range: { start: { line: 0, character: 18 }, end: { line: 0, character: 18 } },
                text: 'r'
            }
        ]);
        // Wait until the LsAndTsDocResolver notifies the services of the document update
        await new Promise((resolve) => setTimeout(resolve, 1000));

        const diagnostics3 = await plugin.getDiagnostics(document);
        assert.deepStrictEqual(diagnostics3.length, 0);
        const diagnostics4 = await plugin.getDiagnostics(otherDocument);
        assert.deepStrictEqual(diagnostics4.length, 0);
    }).timeout(5000);
});
