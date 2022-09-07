import type ts from 'typescript/lib/tsserverlibrary';
import { LocationLink, Position } from 'vscode-languageserver-types';
import type { AstroDocument } from '../../../core/documents';
import { isNotNullOrUndefined, pathToUrl } from '../../../utils';
import type { DefinitionsProvider } from '../../interfaces';
import type { LanguageServiceManager } from '../LanguageServiceManager';
import type { AstroSnapshot } from '../snapshots/DocumentSnapshot';
import {
	convertToLocationRange,
	ensureRealFilePath,
	getScriptTagSnapshot,
	isAstroFilePath,
	isFrameworkFilePath,
	toVirtualAstroFilePath,
} from '../utils';
import { SnapshotFragmentMap } from './utils';

export class DefinitionsProviderImpl implements DefinitionsProvider {
	constructor(private languageServiceManager: LanguageServiceManager) {}

	async getDefinitions(document: AstroDocument, position: Position): Promise<LocationLink[]> {
		const { lang, tsDoc } = await this.languageServiceManager.getLSAndTSDoc(document);
		const mainFragment = await tsDoc.createFragment();

		const tsFilePath = toVirtualAstroFilePath(tsDoc.filePath);

		const fragmentPosition = mainFragment.getGeneratedPosition(position);
		const fragmentOffset = mainFragment.offsetAt(fragmentPosition);

		let defs: ts.DefinitionInfoAndBoundSpan | undefined;

		const html = document.html;
		const offset = document.offsetAt(position);
		const node = html.findNodeAt(offset);

		if (node.tag === 'script') {
			const {
				snapshot: scriptTagSnapshot,
				filePath: scriptFilePath,
				offset: scriptOffset,
			} = getScriptTagSnapshot(tsDoc as AstroSnapshot, document, node, position);

			defs = lang.getDefinitionAndBoundSpan(scriptFilePath, scriptOffset);

			if (defs) {
				defs.definitions = defs.definitions?.map((def) => {
					const isInSameFile = def.fileName === scriptFilePath;
					def.fileName = isInSameFile ? tsFilePath : def.fileName;

					if (isInSameFile) {
						def.textSpan.start = mainFragment.offsetAt(
							scriptTagSnapshot.getOriginalPosition(scriptTagSnapshot.positionAt(def.textSpan.start))
						);
					}

					return def;
				});

				defs.textSpan.start = mainFragment.offsetAt(
					scriptTagSnapshot.getOriginalPosition(scriptTagSnapshot.positionAt(defs.textSpan.start))
				);
			}
		} else {
			defs = lang.getDefinitionAndBoundSpan(tsFilePath, fragmentOffset);
		}

		if (!defs || !defs.definitions) {
			return [];
		}

		const docs = new SnapshotFragmentMap(this.languageServiceManager);
		docs.set(tsFilePath, { fragment: mainFragment, snapshot: tsDoc });

		const result = await Promise.all(
			defs.definitions!.map(async (def) => {
				const { fragment, snapshot } = await docs.retrieve(def.fileName);

				const fileName = ensureRealFilePath(def.fileName);

				// For Astro, Svelte and Vue, the position is wrongly mapped to the end of the file due to the TSX output
				// So we'll instead redirect to the beginning of the file
				const isFramework = isFrameworkFilePath(def.fileName) || isAstroFilePath(def.fileName);
				const textSpan = isFramework && tsDoc.filePath !== def.fileName ? { start: 0, length: 0 } : def.textSpan;

				return LocationLink.create(
					pathToUrl(fileName),
					convertToLocationRange(fragment, textSpan),
					convertToLocationRange(fragment, textSpan),
					convertToLocationRange(mainFragment, defs!.textSpan)
				);
			})
		);
		return result.filter(isNotNullOrUndefined);
	}
}
