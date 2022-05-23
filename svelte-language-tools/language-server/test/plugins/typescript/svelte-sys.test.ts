import * as assert from 'assert';
import sinon from 'sinon';
import ts from 'typescript';
import { DocumentSnapshot } from '../../../src/plugins/typescript/DocumentSnapshot';
import { createSvelteSys } from '../../../src/plugins/typescript/svelte-sys';

describe('Svelte Sys', () => {
    afterEach(() => {
        sinon.restore();
    });

    function setupLoader() {
        const tsFile = 'const a = "ts file";';
        const svelteFile = 'const a = "svelte file";';

        const fileExistsStub = sinon.stub().returns(true);
        const getSnapshotStub = sinon.stub().callsFake(
            (path: string) =>
                <Partial<DocumentSnapshot>>{
                    getText: () => (path.endsWith('.svelte.ts') ? svelteFile : tsFile),
                    getLength: () =>
                        path.endsWith('.svelte.ts') ? svelteFile.length : tsFile.length
                }
        );

        sinon.replace(ts.sys, 'fileExists', fileExistsStub);
        const loader = createSvelteSys(getSnapshotStub);

        return {
            tsFile,
            svelteFile,
            fileExistsStub,
            getSnapshotStub,
            loader
        };
    }

    describe('#fileExists', () => {
        it('should leave files with no .svelte.ts-ending as is', async () => {
            const { loader, fileExistsStub } = setupLoader();
            loader.fileExists('../file.ts');

            assert.strictEqual(fileExistsStub.getCall(0).args[0], '../file.ts');
        });

        it('should convert .svelte.ts-endings', async () => {
            const { loader, fileExistsStub } = setupLoader();
            loader.fileExists('../file.svelte.ts');

            assert.strictEqual(fileExistsStub.getCall(0).args[0], '../file.svelte');
        });
    });

    describe('#readFile', () => {
        it('should invoke getSnapshot for ts/js files', async () => {
            const { loader, getSnapshotStub, tsFile } = setupLoader();
            const code = loader.readFile('../file.ts')!;

            assert.strictEqual(getSnapshotStub.called, true);
            assert.strictEqual(code, tsFile);
        });

        it('should invoke getSnapshot for svelte files', async () => {
            const { loader, getSnapshotStub, svelteFile } = setupLoader();
            const code = loader.readFile('../file.svelte.ts')!;

            assert.strictEqual(getSnapshotStub.called, true);
            assert.strictEqual(code, svelteFile);
        });
    });
});
