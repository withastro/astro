import type ts from 'typescript/lib/tsserverlibrary';
import { AstroSnapshotManager } from '../astro-snapshots.js';
import { Logger } from '../logger';
import { isAstroFilePath } from '../utils.js';
import { decorateCompletions } from './completions.js';
import { decorateGetDefinition } from './definition.js';
import { decorateDiagnostics } from './diagnostics.js';
import { decorateFindReferences } from './find-references.js';
import { decorateGetImplementation } from './implementation.js';
import { decorateRename } from './rename.js';

export function decorateLanguageService(
	ls: ts.LanguageService,
	snapshotManager: AstroSnapshotManager,
	logger: Logger
): ts.LanguageService {
	patchLineColumnOffset(ls, snapshotManager);
	decorateRename(ls, snapshotManager, logger);
	decorateDiagnostics(ls, logger);
	decorateFindReferences(ls, snapshotManager, logger);
	decorateCompletions(ls, logger);
	decorateGetDefinition(ls, snapshotManager, logger);
	decorateGetImplementation(ls, snapshotManager, logger);
	return ls;
}

function patchLineColumnOffset(ls: ts.LanguageService, snapshotManager: AstroSnapshotManager) {
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
