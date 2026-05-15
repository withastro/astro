import * as eslexer from 'es-module-lexer';
import { deserializeActionResult, getActionQueryString } from './runtime/client.js';
import { ACTION_API_CONTEXT_SYMBOL } from './runtime/server.js';
function hasActionPayload(locals) {
	return '_actionPayload' in locals;
}
function createGetActionResult(locals) {
	return (actionFn) => {
		if (
			!hasActionPayload(locals) ||
			actionFn.toString() !== getActionQueryString(locals._actionPayload.actionName)
		) {
			return void 0;
		}
		return deserializeActionResult(locals._actionPayload.actionResult);
	};
}
function createCallAction(context) {
	return (baseAction, input) => {
		Reflect.set(context, ACTION_API_CONTEXT_SYMBOL, true);
		const action = baseAction.bind(context);
		return action(input);
	};
}
let didInitLexer = false;
async function isActionsFilePresent(fs, srcDir) {
	if (!didInitLexer) await eslexer.init;
	const actionsFile = search(fs, srcDir);
	if (!actionsFile) return false;
	let contents;
	try {
		contents = fs.readFileSync(actionsFile.url, 'utf-8');
	} catch {
		return false;
	}
	const [, exports] = eslexer.parse(contents, actionsFile.url.pathname);
	for (const exp of exports) {
		if (exp.n === 'server') {
			return actionsFile.filename;
		}
	}
	return false;
}
function search(fs, srcDir) {
	const filenames = [
		'actions.mjs',
		'actions.js',
		'actions.mts',
		'actions.ts',
		'actions/index.mjs',
		'actions/index.js',
		'actions/index.mts',
		'actions/index.ts',
	];
	for (const filename of filenames) {
		const url = new URL(filename, srcDir);
		if (fs.existsSync(url)) {
			return { filename, url };
		}
	}
	return void 0;
}
export { createCallAction, createGetActionResult, hasActionPayload, isActionsFilePresent };
