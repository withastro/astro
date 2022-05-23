import * as assert from 'assert';
import sinon from 'sinon';
import ts from 'typescript';
import * as svS from '../../../src/plugins/typescript/svelte-sys';
import { DocumentSnapshot } from '../../../src/plugins/typescript/DocumentSnapshot';
import { createSvelteModuleLoader } from '../../../src/plugins/typescript/module-loader';

describe('createSvelteModuleLoader', () => {
    afterEach(() => {
        sinon.restore();
    });

    function setup(resolvedModule: ts.ResolvedModuleFull) {
        const getSvelteSnapshotStub = sinon
            .stub()
            .returns(<Partial<DocumentSnapshot>>{ scriptKind: ts.ScriptKind.JSX });

        const resolveStub = sinon.stub().returns(<ts.ResolvedModuleWithFailedLookupLocations>{
            resolvedModule
        });
        sinon.replace(ts, 'resolveModuleName', resolveStub);

        const svelteSys = <any>'svelteSys';
        sinon.stub(svS, 'createSvelteSys').returns(svelteSys);

        const compilerOptions: ts.CompilerOptions = { strict: true, paths: { '/@/*': [] } };
        const moduleResolver = createSvelteModuleLoader(getSvelteSnapshotStub, compilerOptions);

        return {
            getSvelteSnapshotStub,
            resolveStub,
            compilerOptions,
            moduleResolver,
            svelteSys
        };
    }

    function lastCall(stub: sinon.SinonStub<any[], any>) {
        return stub.getCall(stub.getCalls().length - 1);
    }

    it('uses tsSys for normal files', async () => {
        const resolvedModule: ts.ResolvedModuleFull = {
            extension: ts.Extension.Ts,
            resolvedFileName: 'filename.ts'
        };
        const { resolveStub, moduleResolver, compilerOptions } = setup(resolvedModule);
        const result = moduleResolver.resolveModuleNames(
            ['./normal.ts'],
            'C:/somerepo/somefile.svelte'
        );

        assert.deepStrictEqual(result, [resolvedModule]);
        assert.deepStrictEqual(lastCall(resolveStub).args, [
            './normal.ts',
            'C:/somerepo/somefile.svelte',
            compilerOptions,
            ts.sys
        ]);
    });

    it('uses tsSys for normal files part of TS aliases', async () => {
        const resolvedModule: ts.ResolvedModuleFull = {
            extension: ts.Extension.Ts,
            resolvedFileName: 'filename.ts'
        };
        const { resolveStub, moduleResolver, compilerOptions } = setup(resolvedModule);
        const result = moduleResolver.resolveModuleNames(
            ['/@/normal'],
            'C:/somerepo/somefile.svelte'
        );

        assert.deepStrictEqual(result, [resolvedModule]);
        assert.deepStrictEqual(lastCall(resolveStub).args, [
            '/@/normal',
            'C:/somerepo/somefile.svelte',
            compilerOptions,
            ts.sys
        ]);
    });

    it('uses tsSys for svelte.d.ts files', async () => {
        const resolvedModule: ts.ResolvedModuleFull = {
            extension: ts.Extension.Dts,
            resolvedFileName: 'filename.d.ts'
        };
        const { resolveStub, moduleResolver, compilerOptions } = setup(resolvedModule);
        const result = moduleResolver.resolveModuleNames(
            ['./normal.ts'],
            'C:/somerepo/somefile.svelte'
        );

        assert.deepStrictEqual(result, [resolvedModule]);
        assert.deepStrictEqual(lastCall(resolveStub).args, [
            './normal.ts',
            'C:/somerepo/somefile.svelte',
            compilerOptions,
            ts.sys
        ]);
    });

    it('uses svelte module loader for virtual svelte files', async () => {
        const resolvedModule: ts.ResolvedModuleFull = {
            extension: ts.Extension.Ts,
            resolvedFileName: 'filename.svelte.ts'
        };
        const { resolveStub, svelteSys, moduleResolver, compilerOptions, getSvelteSnapshotStub } =
            setup(resolvedModule);
        const result = moduleResolver.resolveModuleNames(
            ['./svelte.svelte'],
            'C:/somerepo/somefile.svelte'
        );

        assert.deepStrictEqual(result, [
            <ts.ResolvedModuleFull>{
                extension: ts.Extension.Jsx,
                resolvedFileName: 'filename.svelte',
                isExternalLibraryImport: undefined
            }
        ]);
        assert.deepStrictEqual(lastCall(resolveStub).args, [
            './svelte.svelte',
            'C:/somerepo/somefile.svelte',
            compilerOptions,
            svelteSys
        ]);
        assert.deepStrictEqual(lastCall(getSvelteSnapshotStub).args, ['filename.svelte']);
    });

    it('uses svelte module loader for virtual svelte files with TS path aliases', async () => {
        const resolvedModule: ts.ResolvedModuleFull = {
            extension: ts.Extension.Ts,
            resolvedFileName: 'filename.svelte.ts'
        };
        const { resolveStub, svelteSys, moduleResolver, compilerOptions, getSvelteSnapshotStub } =
            setup(resolvedModule);
        const result = moduleResolver.resolveModuleNames(
            ['/@/svelte.svelte'],
            'C:/somerepo/somefile.svelte'
        );

        assert.deepStrictEqual(result, [
            <ts.ResolvedModuleFull>{
                extension: ts.Extension.Jsx,
                resolvedFileName: 'filename.svelte',
                isExternalLibraryImport: undefined
            }
        ]);
        assert.deepStrictEqual(lastCall(resolveStub).args, [
            '/@/svelte.svelte',
            'C:/somerepo/somefile.svelte',
            compilerOptions,
            svelteSys
        ]);
        assert.deepStrictEqual(lastCall(getSvelteSnapshotStub).args, ['filename.svelte']);
    });

    it('uses cache if module was already resolved before', async () => {
        const resolvedModule: ts.ResolvedModuleFull = {
            extension: ts.Extension.Ts,
            resolvedFileName: 'filename.ts'
        };
        const { resolveStub, moduleResolver } = setup(resolvedModule);
        // first call
        moduleResolver.resolveModuleNames(['./normal.ts'], 'C:/somerepo/somefile.svelte');
        // second call, which should be from cache
        const result = moduleResolver.resolveModuleNames(
            ['./normal.ts'],
            'C:/somerepo/somefile.svelte'
        );

        assert.deepStrictEqual(result, [resolvedModule]);
        assert.deepStrictEqual(resolveStub.callCount, 1);
    });
});
