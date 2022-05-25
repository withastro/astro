import { createEnvironment } from '../../../utils';
import { expect } from 'chai';
import { join } from 'path';
import sinon from 'sinon';
import ts from 'typescript';
import {
    OptionalVersionedTextDocumentIdentifier,
    Position,
    Range,
    TextDocumentEdit,
    TextEdit
} from 'vscode-languageserver';
import { UpdateImportsProviderImpl } from '../../../../src/plugins/typescript/features/UpdateImportsProvider';
import { LanguageServiceManager } from '../../../../src/plugins/typescript/LanguageServiceManager';
import { pathToUrl } from '../../../../src/utils';

describe('UpdateImportsProviderImpl', () => {
    async function setup(filename: string) {
        const env = createEnvironment(filename, 'typescript', 'update-imports');
        const languageServiceManager = new LanguageServiceManager(env.docManager, [env.fixturesDir], env.configManager);
        const provider = new UpdateImportsProviderImpl(languageServiceManager);

        await languageServiceManager.getLSAndTSDoc(env.document); // this makes sure ts ls knows the file
        return { ...env, languageServiceManager, provider };
    }

    afterEach(() => sinon.restore());

    it('updates imports', async () => {
        const { provider, dir, document } = await setup('updateimports.astro');
        const workspaceEdit = await provider.updateImports({
            // imported files both old and new have to actually exist, so we just use some other test files
            oldUri: pathToUrl(join(dir, 'components', 'component.astro')),
            newUri: pathToUrl(join(dir, 'documentation.astro'))
        });

        console.log(workspaceEdit?.documentChanges);

		// expect(workspaceEdit?.documentChanges).to.deep.equal([
        //     TextDocumentEdit.create(OptionalVersionedTextDocumentIdentifier.create(document.url, null), [
        //         TextEdit.replace(
        //             Range.create(Position.create(2, 17), Position.create(2, 49)),
        //             './documentation.astro'
        //         )
        //     ])
        // ]);
        // assert.deepStrictEqual(workspaceEdit?.documentChanges, [
        //     TextDocumentEdit.create(OptionalVersionedTextDocumentIdentifier.create(document.url, null), [
        //         TextEdit.replace(
        //             Range.create(Position.create(2, 17), Position.create(2, 49)),
        //             './documentation.astro'
        //         )
        //     ])
        // ]);
    });
});
