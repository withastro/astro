import { Location } from 'vscode-languageserver';
import { AstroDocument } from '../../../core/documents';
import { pathToUrl } from '../../../utils';
import { FileReferencesProvider } from '../../interfaces';
import { LanguageServiceManager } from '../LanguageServiceManager';
import { convertToLocationRange } from '../utils';
import { SnapshotMap } from './utils';

export class FileReferencesProviderImpl implements FileReferencesProvider {
	constructor(private languageServiceManager: LanguageServiceManager) {}

	async fileReferences(document: AstroDocument): Promise<Location[] | null> {
		const { lang, tsDoc } = await this.languageServiceManager.getLSAndTSDoc(document);

		const references = lang.getFileReferences(tsDoc.filePath);

		if (!references) {
			return null;
		}

		const snapshots = new SnapshotMap(this.languageServiceManager);
		snapshots.set(tsDoc.filePath, tsDoc);

		const locations = await Promise.all(
			references.map(async (ref) => {
				const snapshot = await snapshots.retrieve(ref.fileName);

				return Location.create(pathToUrl(ref.fileName), convertToLocationRange(snapshot, ref.textSpan));
			})
		);

		return locations;
	}
}
