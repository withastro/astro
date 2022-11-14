import type ts from 'typescript/lib/tsserverlibrary';
import type { AstroSnapshotManager } from '../astro-snapshots.js';
import type { Logger } from '../logger.js';
import { isAstroFilePath, isNotNullOrUndefined } from '../utils.js';

export function decorateRename(ls: ts.LanguageService, snapshotManager: AstroSnapshotManager, logger: Logger): void {
	const findRenameLocations = ls.findRenameLocations;
	ls.findRenameLocations = (fileName, position, findInStrings, findInComments, providePrefixAndSuffixTextForRename) => {
		const renameLocations = findRenameLocations(
			fileName,
			position,
			findInStrings,
			findInComments,
			providePrefixAndSuffixTextForRename
		);
		return renameLocations
			?.map((renameLocation) => {
				const snapshot = snapshotManager.get(renameLocation.fileName);
				if (!isAstroFilePath(renameLocation.fileName) || !snapshot) {
					return renameLocation;
				}

				// TODO more needed to filter invalid locations, see RenameProvider
				const textSpan = snapshot.getOriginalTextSpan(renameLocation.textSpan);
				if (!textSpan) {
					return null;
				}

				const converted = {
					...renameLocation,
					textSpan,
				};
				if (converted.contextSpan) {
					// Not important, spare the work
					converted.contextSpan = undefined;
				}
				logger.debug('Converted rename location ', converted);
				return converted;
			})
			.filter(isNotNullOrUndefined);
	};
}
