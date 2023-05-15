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

const astroPluginPatchSymbol = Symbol('astroPluginPatchSymbol');

export function isPatched(ls: ts.LanguageService) {
	return (ls as any)[astroPluginPatchSymbol] === true;
}

export function decorateLanguageService(
	ls: ts.LanguageService,
	snapshotManager: AstroSnapshotManager,
	ts: typeof import('typescript/lib/tsserverlibrary'),
	logger: Logger
): ts.LanguageService {
	const proxy = new Proxy(ls, createProxyHandler());

	decorateLineColumnOffset(proxy, snapshotManager);
	decorateRename(proxy, snapshotManager, logger);
	decorateDiagnostics(proxy, ts);
	decorateFindReferences(proxy, snapshotManager, logger);
	decorateCompletions(proxy, logger);
	decorateGetDefinition(proxy, snapshotManager);
	decorateGetImplementation(proxy, snapshotManager);
	decorateGetFileReferences(proxy, snapshotManager);

	return proxy;
}

function createProxyHandler(): ProxyHandler<ts.LanguageService> {
	const decorated: Partial<ts.LanguageService> = {};

	return {
		get(target, p) {
			if (p === astroPluginPatchSymbol) {
				return true;
			}

			return decorated[p as keyof ts.LanguageService] ?? target[p as keyof ts.LanguageService];
		},
		set(_, p, value) {
			decorated[p as keyof ts.LanguageService] = value;

			return true;
		},
	};
}
