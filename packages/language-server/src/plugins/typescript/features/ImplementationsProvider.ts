import type ts from 'typescript';
import { Location, Position } from 'vscode-languageserver-types';
import { AstroDocument, mapRangeToOriginal, mapScriptSpanStartToSnapshot } from '../../../core/documents';
import { isNotNullOrUndefined, pathToUrl } from '../../../utils';
import { ImplementationProvider } from '../../interfaces';
import { LanguageServiceManager } from '../LanguageServiceManager';
import { AstroSnapshot } from '../snapshots/DocumentSnapshot';
import { convertRange, getScriptTagSnapshot } from '../utils';
import { SnapshotMap } from './utils';

export class ImplementationsProviderImpl implements ImplementationProvider {
	constructor(private languageServiceManager: LanguageServiceManager) {}

	async getImplementation(document: AstroDocument, position: Position): Promise<Location[] | null> {
		const { lang, tsDoc } = await this.languageServiceManager.getLSAndTSDoc(document);

		const fragmentPosition = tsDoc.getGeneratedPosition(position);
		const fragmentOffset = tsDoc.offsetAt(fragmentPosition);

		const html = document.html;
		const offset = document.offsetAt(position);
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
						impl.textSpan.start = mapScriptSpanStartToSnapshot(impl.textSpan, scriptTagSnapshot, tsDoc);
					}

					return impl;
				});
			}
		} else {
			implementations = lang.getImplementationAtPosition(tsDoc.filePath, fragmentOffset);
		}

		const snapshots = new SnapshotMap(this.languageServiceManager);
		snapshots.set(tsDoc.filePath, tsDoc);

		if (!implementations) {
			return null;
		}

		const result = await Promise.all(
			implementations.map(async (implementation) => {
				const snapshot = await snapshots.retrieve(implementation.fileName);

				const range = mapRangeToOriginal(snapshot, convertRange(snapshot, implementation.textSpan));

				if (range.start.line >= 0 && range.end.line >= 0) {
					return Location.create(pathToUrl(implementation.fileName), range);
				}
			})
		);

		return result.filter(isNotNullOrUndefined);
	}
}
