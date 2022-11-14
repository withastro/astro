import type ts from 'typescript/lib/tsserverlibrary';
import type { AstroSnapshotManager } from '../astro-snapshots.js';
import { isAstroFilePath, isNotNullOrUndefined } from '../utils.js';

export function decorateGetFileReferences(ls: ts.LanguageService, snapshotManager: AstroSnapshotManager): void {
	const getFileReferences = ls.getFileReferences;
	ls.getFileReferences = (fileName) => {
		const references = getFileReferences(fileName);
		return references
			?.map((ref) => {
				if (!isAstroFilePath(ref.fileName)) {
					return ref;
				}

				const textSpan = snapshotManager.get(ref.fileName)?.getOriginalTextSpan(ref.textSpan);
				if (!textSpan) {
					return undefined;
				}

				return {
					...ref,
					textSpan,
					// Spare the work for now
					contextSpan: undefined,
					originalTextSpan: undefined,
					originalContextSpan: undefined,
				};
			})
			.filter(isNotNullOrUndefined);
	};
}
