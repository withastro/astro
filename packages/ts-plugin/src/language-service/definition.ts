import type ts from 'typescript/lib/tsserverlibrary';
import type { AstroSnapshotManager } from '../astro-snapshots';
import { isAstroFilePath, isNotNullOrUndefined } from '../utils';

export function decorateGetDefinition(ls: ts.LanguageService, snapshotManager: AstroSnapshotManager): void {
	const getDefinitionAndBoundSpan = ls.getDefinitionAndBoundSpan;
	ls.getDefinitionAndBoundSpan = (fileName, position) => {
		const definition = getDefinitionAndBoundSpan(fileName, position);
		if (!definition?.definitions) {
			return definition;
		}

		return {
			...definition,
			definitions: definition.definitions
				.map((def) => {
					if (!isAstroFilePath(def.fileName)) {
						return def;
					}

					let textSpan = snapshotManager.get(def.fileName)?.getOriginalTextSpan(def.textSpan);
					if (!textSpan) {
						// Unmapped positions are for example the default export.
						// Fall back to the start of the file to at least go to the correct file.
						textSpan = { start: 0, length: 1 };
					}
					return {
						...def,
						textSpan,
						// Spare the work for now
						originalTextSpan: undefined,
						contextSpan: undefined,
						originalContextSpan: undefined,
					};
				})
				.filter(isNotNullOrUndefined),
		};
	};
}
