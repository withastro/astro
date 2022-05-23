import * as assert from 'assert';
import { existsSync, readdirSync, readFileSync, statSync, writeFileSync } from 'fs';
import { join } from 'path';
import ts from 'typescript';
import { Document, DocumentManager } from '../../../../../src/lib/documents';
import { LSConfigManager } from '../../../../../src/ls-config';
import { LSAndTSDocResolver } from '../../../../../src/plugins';
import { DiagnosticsProviderImpl } from '../../../../../src/plugins/typescript/features/DiagnosticsProvider';
import { __resetCache } from '../../../../../src/plugins/typescript/service';
import { pathToUrl } from '../../../../../src/utils';

function setup(workspaceDir: string, filePath: string, useNewTransformation: boolean) {
    const docManager = new DocumentManager(
        (textDocument) => new Document(textDocument.uri, textDocument.text)
    );
    const configManager = new LSConfigManager();
    configManager.update({ svelte: { useNewTransformation } });
    const lsAndTsDocResolver = new LSAndTSDocResolver(
        docManager,
        [pathToUrl(workspaceDir)],
        configManager
    );
    const plugin = new DiagnosticsProviderImpl(lsAndTsDocResolver, configManager);
    const document = docManager.openDocument(<any>{
        uri: pathToUrl(filePath),
        text: ts.sys.readFile(filePath) || ''
    });
    return { plugin, document, docManager, lsAndTsDocResolver };
}

function executeTests(dir: string, workspaceDir: string, useNewTransformation: boolean) {
    const inputFile = join(dir, 'input.svelte');
    if (existsSync(inputFile)) {
        const _it = dir.endsWith('.only') ? it.only : it;
        _it(dir.substring(__dirname.length), executeTest(useNewTransformation)).timeout(5000);
    } else {
        const _describe = dir.endsWith('.only') ? describe.only : describe;
        _describe(dir.substring(__dirname.length), () => {
            const subDirs = readdirSync(dir);

            for (const subDir of subDirs) {
                if (statSync(join(dir, subDir)).isDirectory()) {
                    executeTests(join(dir, subDir), workspaceDir, useNewTransformation);
                }
            }
        });
    }

    function executeTest(useNewTransformation: boolean) {
        return async () => {
            const expected = useNewTransformation ? 'expectedv2.json' : 'expected.json';
            const { plugin, document } = setup(workspaceDir, inputFile, useNewTransformation);
            const diagnostics = await plugin.getDiagnostics(document);

            const expectedFile = join(dir, expected);
            if (existsSync(expectedFile)) {
                try {
                    assert.deepStrictEqual(
                        diagnostics,
                        JSON.parse(readFileSync(expectedFile, 'UTF-8'))
                    );
                } catch (e) {
                    if (process.argv.includes('--auto')) {
                        writeFile(`Updated ${expected} for`);
                    } else {
                        throw e;
                    }
                }
            } else {
                writeFile(`Created ${expected} for`);
            }

            function writeFile(msg: string) {
                console.info(msg, dir.substring(__dirname.length));
                writeFileSync(expectedFile, JSON.stringify(diagnostics), 'UTF-8');
            }
        };
    }
}

describe('DiagnosticsProvider', () => {
    describe('(old transformation)', () => {
        executeTests(join(__dirname, 'fixtures'), join(__dirname, 'fixtures'), false);
        // Hacky, but it works. Needed due to testing both new and old transformation
        after(() => {
            __resetCache();
        });
    });

    describe('new transformation', () => {
        executeTests(join(__dirname, 'fixtures'), join(__dirname, 'fixtures'), true);
        // Hacky, but it works. Needed due to testing both new and old transformation
        after(() => {
            __resetCache();
        });
    });
});
