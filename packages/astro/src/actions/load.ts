import { FORBIDDEN_PATH_KEYS } from '@astrojs/internal-helpers/object';
import type { $ZodType } from 'zod/v4/core';
import { ActionNotFoundError } from '@astrojs/runtime/_internal/core/errors/errors-data.js';
import { AstroError } from '@astrojs/runtime/_internal/core/errors/index.js';
import { createAsyncManifestMemo } from '@astrojs/vite-plugin-router/_internal/core/manifest/memo.js';
import type { SSRActions, SSRManifest } from '../types/public/internal.js';
import { NOOP_ACTIONS_MOD } from './noop-actions.js';
import type { ActionAccept, ActionClient } from './runtime/types.js';

function createActionsMemo() {
	return createAsyncManifestMemo(async (manifest) =>
		manifest.actions ? await manifest.actions() : NOOP_ACTIONS_MOD,
	);
}

let actionsMemo = createActionsMemo();

// Dev: re-resolve the actions module on the next request after an action file changed.
if (import.meta.hot) {
	import.meta.hot.on('astro:actions-updated', () => {
		actionsMemo = createActionsMemo();
	});
}

/** Resolves the actions module from the manifest (a no-op module when none). */
export function getActions(manifest: SSRManifest): Promise<SSRActions> {
	return actionsMemo.get(manifest);
}

/** Clears the cached actions of `manifest` so they are re-resolved on the next request. */
export function clearActions(manifest: SSRManifest): void {
	actionsMemo.invalidate(manifest);
}

/** Looks up a single action handler by its dot-separated path. */
export async function getAction(
	manifest: SSRManifest,
	path: string,
): Promise<ActionClient<unknown, ActionAccept, $ZodType>> {
	const pathKeys = path.split('.').map((key) => decodeURIComponent(key));
	let { server } = await getActions(manifest);

	if (!server || !(typeof server === 'object')) {
		throw new TypeError(
			`Expected \`server\` export in actions file to be an object. Received ${typeof server}.`,
		);
	}

	for (const key of pathKeys) {
		// An action is a leaf: once resolved to a function, its own properties
		// are not part of the action namespace and cannot be traversed further.
		if (typeof server === 'function') {
			throw new AstroError({
				...ActionNotFoundError,
				message: ActionNotFoundError.message(pathKeys.join('.')),
			});
		}
		if (FORBIDDEN_PATH_KEYS.has(key)) {
			throw new AstroError({
				...ActionNotFoundError,
				message: ActionNotFoundError.message(pathKeys.join('.')),
			});
		}
		if (!Object.hasOwn(server, key)) {
			throw new AstroError({
				...ActionNotFoundError,
				message: ActionNotFoundError.message(pathKeys.join('.')),
			});
		}
		// @ts-expect-error we are doing a recursion... it's ugly
		server = server[key];
	}
	if (typeof server !== 'function') {
		throw new TypeError(
			`Expected handler for action ${pathKeys.join('.')} to be a function. Received ${typeof server}.`,
		);
	}
	return server;
}
