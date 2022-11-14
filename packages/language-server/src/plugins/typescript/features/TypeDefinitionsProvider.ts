import type ts from 'typescript';
import { Location, Position } from 'vscode-languageserver-protocol';
import { AstroDocument, mapRangeToOriginal, mapScriptSpanStartToSnapshot } from '../../../core/documents';
import { isNotNullOrUndefined, pathToUrl } from '../../../utils';
import type { TypeDefinitionsProvider } from '../../interfaces';
import type { LanguageServiceManager } from '../LanguageServiceManager';
import type { AstroSnapshot } from '../snapshots/DocumentSnapshot';
import { convertRange, ensureRealFilePath, getScriptTagSnapshot } from '../utils';
import { SnapshotMap } from './utils';

export class TypeDefinitionsProviderImpl implements TypeDefinitionsProvider {
	constructor(private languageServiceManager: LanguageServiceManager) {}

	async getTypeDefinitions(document: AstroDocument, position: Position): Promise<Location[]> {
		const { lang, tsDoc } = await this.languageServiceManager.getLSAndTSDoc(document);

		const fragmentPosition = tsDoc.getGeneratedPosition(position);
		const fragmentOffset = tsDoc.offsetAt(fragmentPosition);

		const html = document.html;
		const offset = document.offsetAt(position);
		const node = html.findNodeAt(offset);

		let typeDefs: readonly ts.DefinitionInfo[] | undefined;

		if (node.tag === 'script') {
			const {
				snapshot: scriptTagSnapshot,
				filePath: scriptFilePath,
				offset: scriptOffset,
			} = getScriptTagSnapshot(tsDoc as AstroSnapshot, document, node, position);

			typeDefs = lang.getTypeDefinitionAtPosition(scriptFilePath, scriptOffset);

			if (typeDefs) {
				typeDefs = typeDefs.map((def) => {
					const isInSameFile = def.fileName === scriptFilePath;
					def.fileName = isInSameFile ? tsDoc.filePath : def.fileName;

					if (isInSameFile) {
						def.textSpan.start = mapScriptSpanStartToSnapshot(def.textSpan, scriptTagSnapshot, tsDoc);
					}

					return def;
				});
			}
		} else {
			typeDefs = lang.getTypeDefinitionAtPosition(tsDoc.filePath, fragmentOffset);
		}

		const snapshots = new SnapshotMap(this.languageServiceManager);
		snapshots.set(tsDoc.filePath, tsDoc);

		if (!typeDefs) {
			return [];
		}

		const result = await Promise.all(
			typeDefs.map(async (typeDef) => {
				const snapshot = await snapshots.retrieve(typeDef.fileName);
				const fileName = ensureRealFilePath(typeDef.fileName);

				const range = mapRangeToOriginal(snapshot, convertRange(snapshot, typeDef.textSpan));

				if (range.start.line >= 0 && range.end.line >= 0) {
					return Location.create(pathToUrl(fileName), range);
				}
			})
		);

		return result.filter(isNotNullOrUndefined);
	}
}
