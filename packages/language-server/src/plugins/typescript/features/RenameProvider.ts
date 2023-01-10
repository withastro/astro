import type { Position, Range, WorkspaceEdit } from 'vscode-languageserver-types';
import type { ConfigManager } from '../../../core/config';
import { AstroDocument, mapRangeToOriginal } from '../../../core/documents';
import { pathToUrl } from '../../../utils';
import type { RenameProvider } from '../../interfaces';
import type { LanguageServiceManager } from '../LanguageServiceManager';
import type { AstroSnapshot } from '../snapshots/DocumentSnapshot';
import { convertRange } from '../utils';
import { SnapshotMap } from './utils';

export class RenameProviderImpl implements RenameProvider {
	private ts: typeof import('typescript/lib/tsserverlibrary');

	constructor(private languageServiceManager: LanguageServiceManager, private configManager: ConfigManager) {
		this.ts = languageServiceManager.docContext.ts;
	}

	async prepareRename(document: AstroDocument, position: Position): Promise<Range | null> {
		const { lang, tsDoc } = await this.languageServiceManager.getLSAndTSDoc(document);
		const offset = tsDoc.offsetAt(tsDoc.getGeneratedPosition(position));

		// If our TSX isn't valid, we can't rename safely, so let's abort
		if ((tsDoc as AstroSnapshot).isInErrorState) {
			return null;
		}

		// TODO: Allow renaming of import paths
		// This requires a bit of work, because we need to create files for the new import paths
		const renameInfo = lang.getRenameInfo(tsDoc.filePath, offset, { allowRenameOfImportPath: false });

		if (!renameInfo.canRename) {
			return null;
		}

		return mapRangeToOriginal(tsDoc, convertRange(tsDoc, renameInfo.triggerSpan));
	}

	async rename(document: AstroDocument, position: Position, newName: string): Promise<WorkspaceEdit | null> {
		const { lang, tsDoc } = await this.languageServiceManager.getLSAndTSDoc(document);

		const offset = tsDoc.offsetAt(tsDoc.getGeneratedPosition(position));

		const { providePrefixAndSuffixTextForRename } = await this.configManager.getTSPreferences(document);
		let renames = lang.findRenameLocations(tsDoc.filePath, offset, false, false, providePrefixAndSuffixTextForRename);
		if (!renames) {
			return null;
		}

		const docs = new SnapshotMap(this.languageServiceManager);
		docs.set(tsDoc.filePath, tsDoc);

		const mappedRenames = await Promise.all(
			renames.map(async (rename) => {
				const snapshot = await docs.retrieve(rename.fileName);

				return {
					...rename,
					range: mapRangeToOriginal(snapshot, convertRange(snapshot, rename.textSpan)),
					newName,
				};
			})
		);

		return mappedRenames.reduce(
			(acc, loc) => {
				const uri = pathToUrl(loc.fileName);
				if (!acc.changes[uri]) {
					acc.changes[uri] = [];
				}

				acc.changes[uri].push({
					newText: (loc.prefixText || '') + (loc.newName || newName) + (loc.suffixText || ''),
					range: loc.range,
				});
				return acc;
			},
			<Required<Pick<WorkspaceEdit, 'changes'>>>{ changes: {} }
		);
	}
}
