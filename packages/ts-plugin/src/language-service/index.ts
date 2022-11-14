import type ts from 'typescript/lib/tsserverlibrary';
import type { AstroSnapshotManager } from '../astro-snapshots.js';
import type { Logger } from '../logger';
import { decorateCompletions } from './completions.js';
import { decorateGetDefinition } from './definition.js';
import { decorateDiagnostics } from './diagnostics.js';
import { decorateGetFileReferences } from './file-references.js';
import { decorateFindReferences } from './find-references.js';
import { decorateGetImplementation } from './implementation.js';
import { decorateLineColumnOffset } from './line-column-offset.js';
import { decorateRename } from './rename.js';

export function decorateLanguageService(
	ls: ts.LanguageService,
	snapshotManager: AstroSnapshotManager,
	logger: Logger
): ts.LanguageService {
	decorateLineColumnOffset(ls, snapshotManager);
	decorateRename(ls, snapshotManager, logger);
	decorateDiagnostics(ls);
	decorateFindReferences(ls, snapshotManager, logger);
	decorateCompletions(ls, logger);
	decorateGetDefinition(ls, snapshotManager);
	decorateGetImplementation(ls, snapshotManager);
	decorateGetFileReferences(ls, snapshotManager);

	return ls;
}
