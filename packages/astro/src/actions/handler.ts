import { removeBase } from '@astrojs/internal-helpers/path';
import type { SSRManifest } from '../types/public/index.js';
import type { Pipeline } from '../core/base-pipeline.js';
import type { FetchState } from '../core/app/fetch-state.js';
import { PERSIST_SYMBOL } from '../core/session/runtime.js';
import { ACTION_QUERY_PARAMS } from './consts.js';
import {
	getActionContext,
	parseRequestBody,
	serializeActionResult,
} from './runtime/server.js';

export interface ActionsHandlerDeps {
	pipeline: Pipeline;
	manifest: SSRManifest;
}

/**
 * Creates a handler for Astro actions.
 *
 * For direct action calls (`POST /_actions/actionName`), parses the body,
 * calls the action handler, and returns the serialized response.
 *
 * For form actions (`POST` with `_actionName` query param), runs the action
 * and stores the result on the context so the page can access it, then
 * returns `undefined` to signal that rendering should continue.
 *
 * Returns `undefined` for non-POST requests or when the request should
 * continue to the next handler.
 */
export function createActionsHandler(
	deps: ActionsHandlerDeps,
): (state: FetchState) => Promise<Response | undefined> {
	const { pipeline, manifest } = deps;

	return async (state: FetchState): Promise<Response | undefined> => {
		const request = state.request;

		if (request.method !== 'POST') {
			return undefined;
		}

		const url = new URL(request.url);
		const pathname = removeBase(url.pathname, manifest.base);
		const ctx = await state.getAPIContext();

		if (pathname.startsWith('/_actions/')) {
			const actionName = decodeURIComponent(pathname.slice('/_actions/'.length));

			let baseAction: Awaited<ReturnType<typeof pipeline.getAction>>;
			try {
				baseAction = await pipeline.getAction(actionName);
			} catch {
				return undefined;
			}

			let input: unknown;
			try {
				input = await parseRequestBody(request, pipeline.manifest.actionBodySizeLimit);
			} catch (e) {
				if (e instanceof TypeError) {
					return new Response(e.message, { status: 415 });
				}
				const { ActionError } = await import('./runtime/client.js');
				if (e instanceof ActionError) {
					const serialized = serializeActionResult({ data: undefined, error: e });
					if (serialized.type !== 'empty') {
						return new Response(serialized.body, {
							status: serialized.status,
							headers: { 'Content-Type': serialized.contentType },
						});
					}
				}
				throw e;
			}

			const handler = baseAction.bind(ctx);
			const result = await handler(input);
			const serialized = serializeActionResult(result);

			const response =
				serialized.type === 'empty'
					? new Response(null, { status: serialized.status })
					: new Response(serialized.body, {
							status: serialized.status,
							headers: { 'Content-Type': serialized.contentType },
						});

			if (ctx.session) {
				await (ctx.session as any)[PERSIST_SYMBOL]?.();
			}
			for (const setCookieValue of ctx.cookies.headers()) {
				response.headers.append('set-cookie', setCookieValue);
			}

			return response;
		}

		const formActionName = url.searchParams.get(ACTION_QUERY_PARAMS.actionName);
		if (formActionName && !ctx.isPrerendered) {
			const { action, setActionResult, serializeActionResult: serializeResult } = getActionContext(ctx);
			if (action?.calledFrom === 'form') {
				const actionResult = await action.handler();
				setActionResult(action.name, serializeResult(actionResult));
			}
		}

		return undefined;
	};
}
