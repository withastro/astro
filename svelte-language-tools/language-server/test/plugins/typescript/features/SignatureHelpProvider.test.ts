import path from 'path';
import assert from 'assert';
import ts from 'typescript';
import {
    CancellationTokenSource,
    MarkupKind,
    Position,
    SignatureHelp
} from 'vscode-languageserver';
import { Document, DocumentManager } from '../../../../src/lib/documents';
import { SignatureHelpProviderImpl } from '../../../../src/plugins/typescript/features/SignatureHelpProvider';
import { LSAndTSDocResolver } from '../../../../src/plugins/typescript/LSAndTSDocResolver';
import { pathToUrl } from '../../../../src/utils';
import { LSConfigManager } from '../../../../src/ls-config';

const testDir = path.join(__dirname, '..');

describe('SignatureHelpProvider', () => {
    function setup() {
        const docManager = new DocumentManager(
            (textDocument) => new Document(textDocument.uri, textDocument.text)
        );
        const filePath = path.join(testDir, 'testfiles', 'signature-help', 'signature-help.svelte');
        const lsAndTsDocResolver = new LSAndTSDocResolver(
            docManager,
            [pathToUrl(testDir)],
            new LSConfigManager()
        );
        const provider = new SignatureHelpProviderImpl(lsAndTsDocResolver);
        const document = docManager.openDocument(<any>{
            uri: pathToUrl(filePath),
            text: ts.sys.readFile(filePath)
        });
        return { provider, document };
    }

    it('provide signature help with formatted documentation', async () => {
        const { provider, document } = setup();

        const result = await provider.getSignatureHelp(document, Position.create(3, 8), undefined);

        assert.deepStrictEqual(result, <SignatureHelp>{
            signatures: [
                {
                    label: 'foo(): boolean',
                    documentation: { value: 'bars\n\n*@author* — John', kind: MarkupKind.Markdown },
                    parameters: []
                }
            ],
            activeParameter: 0,
            activeSignature: 0
        });
    });

    it('provide signature help with function signatures', async () => {
        const { provider, document } = setup();

        const result = await provider.getSignatureHelp(document, Position.create(4, 12), undefined);

        assert.deepStrictEqual(result, <SignatureHelp>{
            signatures: [
                {
                    label: 'abc(a: number, b: number): string',
                    documentation: undefined,
                    parameters: [
                        {
                            label: [4, 13]
                        },
                        {
                            label: [15, 24]
                        }
                    ]
                },
                {
                    label: 'abc(a: number, b: string): string',
                    documentation: undefined,
                    parameters: [
                        {
                            label: [4, 13]
                        },
                        {
                            label: [15, 24],
                            documentation: 'formatted number'
                        }
                    ]
                }
            ],
            activeParameter: 1,
            activeSignature: 1
        });
    });

    it('filter out svelte2tsx signature', async () => {
        const { provider, document } = setup();

        const result = await provider.getSignatureHelp(
            document,
            Position.create(18, 18),
            undefined
        );

        assert.equal(result, null);
    });

    it('provide signature help with formatted documentation', async () => {
        const { provider, document } = setup();
        const cancellationTokenSource = new CancellationTokenSource();

        const signatureHelpPromise = provider.getSignatureHelp(
            document,
            Position.create(3, 8),
            undefined,
            cancellationTokenSource.token
        );
        cancellationTokenSource.cancel();

        assert.deepStrictEqual(await signatureHelpPromise, null);
    });
});
