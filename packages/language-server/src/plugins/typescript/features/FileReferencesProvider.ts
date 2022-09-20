import { Location } from 'vscode-languageserver';
import { AstroDocument } from '../../../core/documents';
import { pathToUrl } from '../../../utils';
import { FileReferencesProvider } from '../../interfaces';
import { LanguageServiceManager } from '../LanguageServiceManager';
import { convertToLocationRange } from '../utils';
import { SnapshotFragmentMap } from './utils';

export class FileReferencesProviderImpl implements FileReferencesProvider {
	constructor(private languageServiceManager: LanguageServiceManager) {}

	async fileReferences(document: AstroDocument): Promise<Location[] | null> {
		const { lang, tsDoc } = await this.languageServiceManager.getLSAndTSDoc(document);
		const mainFragment = await tsDoc.createFragment();

		const references = lang.getFileReferences(tsDoc.filePath);

		if (!references) {
			return null;
		}

		const docs = new SnapshotFragmentMap(this.languageServiceManager);
		docs.set(tsDoc.filePath, { fragment: mainFragment, snapshot: tsDoc });

		const locations = await Promise.all(
			references.map(async (ref) => {
				const defDoc = await docs.retrieveFragment(ref.fileName);

				return Location.create(pathToUrl(ref.fileName), convertToLocationRange(defDoc, ref.textSpan));
			})
		);

		return locations;
	}
}
