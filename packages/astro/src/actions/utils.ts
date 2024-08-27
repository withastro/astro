import * as eslexer from 'es-module-lexer';
import type fsMod from 'node:fs';
import type { APIContext } from '../@types/astro.js';
import type { Locals } from './runtime/middleware.js';
import type { ActionAPIContext } from './runtime/utils.js';
import { deserializeActionResult, getActionQueryString } from './runtime/virtual/shared.js';

export function hasActionPayload(locals: APIContext['locals']): locals is Locals {
	return '_actionPayload' in locals;
}

export function createGetActionResult(locals: APIContext['locals']): APIContext['getActionResult'] {
	return (actionFn): any => {
		if (
			!hasActionPayload(locals) ||
			actionFn.toString() !== getActionQueryString(locals._actionPayload.actionName)
		) {
			return undefined;
		}
		return deserializeActionResult(locals._actionPayload.actionResult);
	};
}

export function createCallAction(context: ActionAPIContext): APIContext['callAction'] {
	return (baseAction, input) => {
		const action = baseAction.bind(context);
		return action(input) as any;
	};
}

let didInitLexer = false;

export async function usesActions(fs: typeof fsMod, srcDir: URL) {
	if (!didInitLexer) await eslexer.init;

	const actionsFile = search(fs, srcDir);
	if (!actionsFile) return false;

	let contents: string;
	try {
		contents = fs.readFileSync(actionsFile, 'utf-8');
	} catch {
		return false;
	}

	const [, exports] = eslexer.parse(contents, actionsFile.pathname);
	for (const exp of exports) {
		if (exp.n === 'server') {
			return true;
		}
	}
	return false;
}

function search(fs: typeof fsMod, srcDir: URL) {
	const paths = [
		'actions.mjs',
		'actions.js',
		'actions.mts',
		'actions.ts',
		'actions/index.mjs',
		'actions/index.js',
		'actions/index.mts',
		'actions/index.ts',
	].map((p) => new URL(p, srcDir));
	for (const file of paths) {
		if (fs.existsSync(file)) {
			return file;
		}
	}
	return undefined;
}
