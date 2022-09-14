import { expect } from 'chai';
import sinon from 'sinon';
import ts from 'typescript/lib/tsserverlibrary';
import * as aSys from '../../../src/plugins/typescript/astro-sys';
import { DocumentSnapshot } from '../../../src/plugins/typescript/snapshots/DocumentSnapshot';
import { createAstroModuleLoader } from '../../../src/plugins/typescript/module-loader';

describe('createAstroModuleLoader', () => {
	afterEach(() => {
		sinon.restore();
	});

	function setup(resolvedModule: ts.ResolvedModuleFull) {
		const getAstroSnapshotStub = sinon.stub().returns(<Partial<DocumentSnapshot>>{ scriptKind: ts.ScriptKind.TSX });

		const resolveStub = sinon.stub().returns(<ts.ResolvedModuleWithFailedLookupLocations>{
			resolvedModule,
		});
		sinon.replace(ts, 'resolveModuleName', resolveStub);

		const astroSys = <any>'astroSys';
		sinon.stub(aSys, 'createAstroSys').returns(astroSys);

		const compilerOptions: ts.CompilerOptions = { strict: true, paths: { '/@/*': [] } };
		const moduleResolver = createAstroModuleLoader(getAstroSnapshotStub, compilerOptions, ts);

		return {
			getAstroSnapshotStub,
			resolveStub,
			compilerOptions,
			moduleResolver,
			astroSys,
		};
	}

	function lastCall(stub: sinon.SinonStub<any[], any>) {
		return stub.getCall(stub.getCalls().length - 1);
	}

	it('uses tsSys for normal files', async () => {
		const resolvedModule: ts.ResolvedModuleFull = {
			extension: ts.Extension.Ts,
			resolvedFileName: 'filename.ts',
		};
		const { resolveStub, moduleResolver, compilerOptions } = setup(resolvedModule);
		const result = moduleResolver.resolveModuleNames(
			['./normal.ts'],
			'C:/somerepo/somefile.astro',
			undefined,
			undefined,
			undefined as any
		);

		expect(result).to.deep.equal([resolvedModule]);
		expect(lastCall(resolveStub).args).to.deep.equal([
			'./normal.ts',
			'C:/somerepo/somefile.astro',
			compilerOptions,
			ts.sys,
			undefined,
			undefined,
			undefined,
		]);
	});

	it('uses tsSys for normal files using tsconfig.json aliases', async () => {
		const resolvedModule: ts.ResolvedModuleFull = {
			extension: ts.Extension.Ts,
			resolvedFileName: 'filename.ts',
		};
		const { resolveStub, moduleResolver, compilerOptions } = setup(resolvedModule);
		const result = moduleResolver.resolveModuleNames(
			['/@/normal'],
			'C:/repo/file.astro',
			undefined,
			undefined,
			undefined as any
		);

		expect(result).to.deep.equal([resolvedModule]);
		expect(lastCall(resolveStub).args).to.deep.equal([
			'/@/normal',
			'C:/repo/file.astro',
			compilerOptions,
			ts.sys,
			undefined,
			undefined,
			undefined,
		]);
	});

	it('uses tsSys for .d.ts files', async () => {
		const resolvedModule: ts.ResolvedModuleFull = {
			extension: ts.Extension.Dts,
			resolvedFileName: 'filename.d.ts',
		};
		const { resolveStub, moduleResolver, compilerOptions } = setup(resolvedModule);
		const result = moduleResolver.resolveModuleNames(
			['./normal.d.ts'],
			'C:/repo/file.astro',
			undefined,
			undefined,
			undefined as any
		);

		expect(result).to.deep.equal([resolvedModule]);
		expect(lastCall(resolveStub).args).to.deep.equal([
			'./normal.d.ts',
			'C:/repo/file.astro',
			compilerOptions,
			ts.sys,
			undefined,
			undefined,
			undefined,
		]);
	});

	it('uses astro module loader for virtual astro files', async () => {
		const resolvedModule: ts.ResolvedModuleFull = {
			extension: ts.Extension.Tsx,
			resolvedFileName: 'filename.astro.tsx',
		};
		const { resolveStub, astroSys, moduleResolver, compilerOptions, getAstroSnapshotStub } = setup(resolvedModule);
		const result = moduleResolver.resolveModuleNames(
			['./astro.astro'],
			'C:/repo/file.astro',
			undefined,
			undefined,
			undefined as any
		);

		expect(result).to.deep.equal([
			<ts.ResolvedModuleFull>{
				extension: ts.Extension.Tsx,
				resolvedFileName: 'filename.astro',
				isExternalLibraryImport: undefined,
			},
		]);
		expect(lastCall(resolveStub).args).to.deep.equal([
			'./astro.astro',
			'C:/repo/file.astro',
			compilerOptions,
			astroSys,
			undefined,
			undefined,
			undefined,
		]);
		expect(lastCall(getAstroSnapshotStub).args).to.deep.equal(['filename.astro']);
	});

	it('uses astro module loader for virtual svelte files', async () => {
		const resolvedModule: ts.ResolvedModuleFull = {
			extension: ts.Extension.Tsx,
			resolvedFileName: 'filename.svelte.tsx',
		};
		const { resolveStub, astroSys, moduleResolver, compilerOptions, getAstroSnapshotStub } = setup(resolvedModule);
		const result = moduleResolver.resolveModuleNames(
			['./svelte.svelte'],
			'C:/repo/file.astro',
			undefined,
			undefined,
			undefined as any
		);

		expect(result).to.deep.equal([
			<ts.ResolvedModuleFull>{
				extension: ts.Extension.Tsx,
				resolvedFileName: 'filename.svelte',
				isExternalLibraryImport: undefined,
			},
		]);
		expect(lastCall(resolveStub).args).to.deep.equal([
			'./svelte.svelte',
			'C:/repo/file.astro',
			compilerOptions,
			astroSys,
			undefined,
			undefined,
			undefined,
		]);
		expect(lastCall(getAstroSnapshotStub).args).to.deep.equal(['filename.svelte']);
	});

	it('uses astro module loader for virtual vue files', async () => {
		const resolvedModule: ts.ResolvedModuleFull = {
			extension: ts.Extension.Tsx,
			resolvedFileName: 'filename.vue.tsx',
		};
		const { resolveStub, astroSys, moduleResolver, compilerOptions, getAstroSnapshotStub } = setup(resolvedModule);
		const result = moduleResolver.resolveModuleNames(
			['./vue.vue'],
			'C:/repo/file.astro',
			undefined,
			undefined,
			undefined as any
		);

		expect(result).to.deep.equal([
			<ts.ResolvedModuleFull>{
				extension: ts.Extension.Tsx,
				resolvedFileName: 'filename.vue',
				isExternalLibraryImport: undefined,
			},
		]);
		expect(lastCall(resolveStub).args).to.deep.equal([
			'./vue.vue',
			'C:/repo/file.astro',
			compilerOptions,
			astroSys,
			undefined,
			undefined,
			undefined,
		]);
		expect(lastCall(getAstroSnapshotStub).args).to.deep.equal(['filename.vue']);
	});
});
