import type ts from 'typescript';
import { Location, Position, ReferenceContext } from 'vscode-languageserver-types';
import { AstroDocument, mapRangeToOriginal } from '../../../core/documents';
import { isNotNullOrUndefined, pathToUrl } from '../../../utils';
import type { FindReferencesProvider } from '../../interfaces';
import type { LanguageServiceManager } from '../LanguageServiceManager';
import { AstroSnapshot } from '../snapshots/DocumentSnapshot';
import { convertRange, getScriptTagSnapshot } from '../utils';
import { SnapshotFragmentMap } from './utils';

export class FindReferencesProviderImpl implements FindReferencesProvider {
	constructor(private languageServiceManager: LanguageServiceManager) {}

	async findReferences(
		document: AstroDocument,
		position: Position,
		context: ReferenceContext
	): Promise<Location[] | null> {
		const { lang, tsDoc } = await this.languageServiceManager.getLSAndTSDoc(document);
		const mainFragment = await tsDoc.createFragment();

		const offset = mainFragment.offsetAt(mainFragment.getGeneratedPosition(position));
		const node = document.html.findNodeAt(offset);

		let references: ts.ReferenceEntry[] | undefined;

		if (node.tag === 'script') {
			const {
				snapshot: scriptTagSnapshot,
				filePath: scriptFilePath,
				offset: scriptOffset,
			} = getScriptTagSnapshot(tsDoc as AstroSnapshot, document, node, position);

			references = lang.getReferencesAtPosition(scriptFilePath, scriptOffset);

			if (references) {
				references = references.map((ref) => {
					const isInSameFile = ref.fileName === scriptFilePath;
					ref.fileName = isInSameFile ? tsDoc.filePath : ref.fileName;

					if (isInSameFile) {
						ref.textSpan.start = mainFragment.offsetAt(
							scriptTagSnapshot.getOriginalPosition(scriptTagSnapshot.positionAt(ref.textSpan.start))
						);
					}

					return ref;
				});
			}
		} else {
			references = lang.getReferencesAtPosition(tsDoc.filePath, offset);
		}

		if (!references) {
			return null;
		}

		const docs = new SnapshotFragmentMap(this.languageServiceManager);
		docs.set(tsDoc.filePath, { fragment: mainFragment, snapshot: tsDoc });

		const result = await Promise.all(
			references.map(async (reference) => {
				if (!context.includeDeclaration) {
					return null;
				}

				const { fragment } = await docs.retrieve(reference.fileName);

				const range = mapRangeToOriginal(fragment, convertRange(fragment, reference.textSpan));

				if (range.start.line >= 0 && range.end.line >= 0) {
					return Location.create(pathToUrl(reference.fileName), range);
				}
			})
		);

		return result.filter(isNotNullOrUndefined);
	}
}
