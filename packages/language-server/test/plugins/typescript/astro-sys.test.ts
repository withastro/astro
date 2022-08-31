import { expect } from 'chai';
import sinon from 'sinon';
import ts from 'typescript/lib/tsserverlibrary';
import { DocumentSnapshot } from '../../../src/plugins/typescript/snapshots/DocumentSnapshot';
import { createAstroSys } from '../../../src/plugins/typescript/astro-sys';

describe('Astro Sys', () => {
	afterEach(() => {
		sinon.restore();
	});

	function setupLoader() {
		const fileExistsStub = sinon.stub().returns(true);
		const getSnapshotStub = sinon.stub().callsFake(
			() =>
				<Partial<DocumentSnapshot>>{
					getText: () => 'Astro',
					getLength: () => 5,
				}
		);

		sinon.replace(ts.sys, 'fileExists', fileExistsStub);
		const loader = createAstroSys(getSnapshotStub, ts);

		return {
			fileExistsStub,
			loader,
		};
	}

	describe('fileExists', () => {
		it('should convert .astro.tsx-endings', async () => {
			const { loader, fileExistsStub } = setupLoader();
			loader.fileExists('../file.astro.tsx');

			expect(fileExistsStub.getCall(0).args[0]).to.equal('../file.astro');
		});

		it('should not convert non-virtual files', async () => {
			const { loader, fileExistsStub } = setupLoader();
			loader.fileExists('../file.tsx');

			expect(fileExistsStub.getCall(0).args[0]).to.equal('../file.tsx');
		});
	});
});
