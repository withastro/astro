import type ts from 'typescript';
import { Location, Position } from 'vscode-languageserver-protocol';
import { AstroDocument, mapRangeToOriginal } from '../../../core/documents';
import { isNotNullOrUndefined, pathToUrl } from '../../../utils';
import type { TypeDefinitionProvider } from '../../interfaces';
import type { LanguageServiceManager } from '../LanguageServiceManager';
import type { AstroSnapshot } from '../snapshots/DocumentSnapshot';
import { convertRange, ensureRealFilePath, getScriptTagSnapshot, toVirtualAstroFilePath } from '../utils';
import { SnapshotFragmentMap } from './utils';

export class TypeDefinitionsProviderImpl implements TypeDefinitionProvider {
	constructor(private languageServiceManager: LanguageServiceManager) {}

	async getTypeDefinitions(document: AstroDocument, position: Position): Promise<Location[]> {
		const { lang, tsDoc } = await this.languageServiceManager.getLSAndTSDoc(document);

		const mainFragment = await tsDoc.createFragment();
		const fragmentOffset = mainFragment.offsetAt(mainFragment.getGeneratedPosition(position));

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
						def.textSpan.start = mainFragment.offsetAt(
							scriptTagSnapshot.getOriginalPosition(scriptTagSnapshot.positionAt(def.textSpan.start))
						);
					}

					return def;
				});
			}
		} else {
			typeDefs = lang.getTypeDefinitionAtPosition(tsDoc.filePath, fragmentOffset);
		}

		const docs = new SnapshotFragmentMap(this.languageServiceManager);
		docs.set(tsDoc.filePath, { fragment: mainFragment, snapshot: tsDoc });

		if (!typeDefs) {
			return [];
		}

		const result = await Promise.all(
			typeDefs.map(async (typeDef) => {
				const { fragment } = await docs.retrieve(typeDef.fileName);
				const fileName = ensureRealFilePath(typeDef.fileName);

				const range = mapRangeToOriginal(fragment, convertRange(fragment, typeDef.textSpan));

				if (range.start.line >= 0 && range.end.line >= 0) {
					return Location.create(pathToUrl(fileName), range);
				}
			})
		);

		return result.filter(isNotNullOrUndefined);
	}
}
