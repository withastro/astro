import type ts from 'typescript';
import { Location, Position, ReferenceContext } from 'vscode-languageserver-types';
import { AstroDocument, mapRangeToOriginal, mapScriptSpanStartToSnapshot } from '../../../core/documents';
import { isNotNullOrUndefined, pathToUrl } from '../../../utils';
import type { FindReferencesProvider } from '../../interfaces';
import type { LanguageServiceManager } from '../LanguageServiceManager';
import { AstroSnapshot } from '../snapshots/DocumentSnapshot';
import { convertRange, getScriptTagSnapshot } from '../utils';
import { SnapshotMap } from './utils';

export class FindReferencesProviderImpl implements FindReferencesProvider {
	constructor(private languageServiceManager: LanguageServiceManager) {}

	async findReferences(
		document: AstroDocument,
		position: Position,
		context: ReferenceContext
	): Promise<Location[] | null> {
		const { lang, tsDoc } = await this.languageServiceManager.getLSAndTSDoc(document);

		const fragmentPosition = tsDoc.getGeneratedPosition(position);
		const fragmentOffset = tsDoc.offsetAt(fragmentPosition);

		const offset = document.offsetAt(position);
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
						ref.textSpan.start = mapScriptSpanStartToSnapshot(ref.textSpan, scriptTagSnapshot, tsDoc);
					}

					return ref;
				});
			}
		} else {
			references = lang.getReferencesAtPosition(tsDoc.filePath, fragmentOffset);
		}

		if (!references) {
			return null;
		}

		const snapshots = new SnapshotMap(this.languageServiceManager);
		snapshots.set(tsDoc.filePath, tsDoc);

		const result = await Promise.all(
			references.map(async (reference) => {
				if (!context.includeDeclaration) {
					return null;
				}

				const snapshot = await snapshots.retrieve(reference.fileName);

				const range = mapRangeToOriginal(snapshot, convertRange(snapshot, reference.textSpan));

				if (range.start.line >= 0 && range.end.line >= 0) {
					return Location.create(pathToUrl(reference.fileName), range);
				}
			})
		);

		return result.filter(isNotNullOrUndefined);
	}
}
