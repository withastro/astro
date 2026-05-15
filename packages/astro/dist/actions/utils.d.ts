import type fsMod from 'node:fs';
import type { APIContext } from '../types/public/context.js';
import type { ActionAPIContext, ActionsLocals } from './runtime/types.js';
export declare function hasActionPayload(locals: APIContext['locals']): locals is ActionsLocals;
export declare function createGetActionResult(
	locals: APIContext['locals'],
): APIContext['getActionResult'];
export declare function createCallAction(context: ActionAPIContext): APIContext['callAction'];
/**
 * Check whether the Actions config file is present.
 */
export declare function isActionsFilePresent(
	fs: typeof fsMod,
	srcDir: URL,
): Promise<string | false>;
