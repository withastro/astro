import type ts from 'typescript/lib/tsserverlibrary';
import type { AstroSnapshotManager } from '../astro-snapshots';
import { isAstroFilePath } from '../utils';

export function decorateLineColumnOffset(ls: ts.LanguageService, snapshotManager: AstroSnapshotManager) {
	if (!ls.toLineColumnOffset) {
		return;
	}

	// We need to patch this because (according to source, only) getDefinition uses this
	const toLineColumnOffset = ls.toLineColumnOffset;
	ls.toLineColumnOffset = (fileName, position) => {
		if (isAstroFilePath(fileName)) {
			const snapshot = snapshotManager.get(fileName);
			if (snapshot) {
				return snapshot.positionAt(position);
			}
		}
		return toLineColumnOffset(fileName, position);
	};
}
