import { Position, LocationLink } from 'vscode-languageserver-types';
import { AstroDocument } from '../../../core/documents';
import { pathToUrl, isNotNullOrUndefined } from '../../../utils';
import { DefinitionsProvider } from '../../interfaces';
import { LanguageServiceManager } from '../LanguageServiceManager';
import {
	toVirtualAstroFilePath,
	ensureRealFilePath,
	isFrameworkFilePath,
	isAstroFilePath,
	convertToLocationRange,
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

		const defs = lang.getDefinitionAndBoundSpan(tsFilePath, fragmentOffset);

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
