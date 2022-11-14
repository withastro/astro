import type ts from 'typescript/lib/tsserverlibrary';
import type { AstroSnapshotManager } from '../astro-snapshots.js';
import { isAstroFilePath, isNotNullOrUndefined } from '../utils.js';

export function decorateGetImplementation(ls: ts.LanguageService, snapshotManager: AstroSnapshotManager): void {
	const getImplementationAtPosition = ls.getImplementationAtPosition;
	ls.getImplementationAtPosition = (fileName, position) => {
		const implementation = getImplementationAtPosition(fileName, position);
		return implementation
			?.map((impl) => {
				if (!isAstroFilePath(impl.fileName)) {
					return impl;
				}

				const textSpan = snapshotManager.get(impl.fileName)?.getOriginalTextSpan(impl.textSpan);
				if (!textSpan) {
					return undefined;
				}

				return {
					...impl,
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
