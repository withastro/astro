import { Position, Location } from 'vscode-languageserver-types';
import { AstroDocument, mapRangeToOriginal } from '../../../core/documents';
import { ImplementationProvider } from '../../interfaces';
import { LanguageServiceManager } from '../LanguageServiceManager';
import type ts from 'typescript';
import { SnapshotFragmentMap } from './utils';
import { isNotNullOrUndefined, pathToUrl } from '../../../utils';
import { convertRange, getScriptTagSnapshot } from '../utils';
import { AstroSnapshot } from '../snapshots/DocumentSnapshot';

export class ImplementationsProviderImpl implements ImplementationProvider {
	constructor(private languageServiceManager: LanguageServiceManager) {}

	async getImplementation(document: AstroDocument, position: Position): Promise<Location[] | null> {
		const { lang, tsDoc } = await this.languageServiceManager.getLSAndTSDoc(document);
		const mainFragment = await tsDoc.createFragment();

		const offset = mainFragment.offsetAt(mainFragment.getGeneratedPosition(position));
		const node = document.html.findNodeAt(offset);

		let implementations: readonly ts.ImplementationLocation[] | undefined;

		if (node.tag === 'script') {
			const {
				snapshot: scriptTagSnapshot,
				filePath: scriptFilePath,
				offset: scriptOffset,
			} = getScriptTagSnapshot(tsDoc as AstroSnapshot, document, node, position);

			implementations = lang.getImplementationAtPosition(scriptFilePath, scriptOffset);

			if (implementations) {
				implementations = implementations.map((impl) => {
					const isInSameFile = impl.fileName === scriptFilePath;
					impl.fileName = isInSameFile ? tsDoc.filePath : impl.fileName;

					if (isInSameFile) {
						impl.textSpan.start = mainFragment.offsetAt(
							scriptTagSnapshot.getOriginalPosition(scriptTagSnapshot.positionAt(impl.textSpan.start))
						);
					}

					return impl;
				});
			}
		} else {
			implementations = lang.getImplementationAtPosition(tsDoc.filePath, offset);
		}

		const docs = new SnapshotFragmentMap(this.languageServiceManager);
		docs.set(tsDoc.filePath, { fragment: mainFragment, snapshot: tsDoc });

		if (!implementations) {
			return null;
		}

		const result = await Promise.all(
			implementations.map(async (implementation) => {
				const { fragment } = await docs.retrieve(implementation.fileName);

				const range = mapRangeToOriginal(fragment, convertRange(fragment, implementation.textSpan));

				if (range.start.line >= 0 && range.end.line >= 0) {
					return Location.create(pathToUrl(implementation.fileName), range);
				}
			})
		);

		return result.filter(isNotNullOrUndefined);
	}
}
