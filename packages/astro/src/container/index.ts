import { renderComponentToIterable } from '../runtime/server/index.js';
import { HTMLParts } from '../runtime/server/render/common.js';
import { nodeLogDestination } from '../core/logger/node.js';
import { createBasicEnvironment, createRenderContext } from '../core/render/index.js';
import { createResult } from '../core/render/result.js';
import type { CreateBasicEnvironmentArgs, Environment } from '../core/render/environment.js';

export class AstroContainer {
	env: Environment;

	constructor(opts: Pick<CreateBasicEnvironmentArgs, 'mode'|'renderers'|'site'>) {
		this.env = createBasicEnvironment({
			...opts,
			logging: { dest: nodeLogDestination, level: 'error' },
		});
	}

	async renderToString(
		Component: any,
		{
			request = new Request('http://localhost:3000'),
			props = {},
			params = {},
			slots = {},
		}: {
			props: Record<string | number | symbol, any>,
			slots?: Record<string, any>
			params?: Record<string, any>,
			request?: Request,
		}
	) {
		const { env } = this;
		const ctx = createRenderContext({ request })
		const result = createResult({
			adapterName: env.adapterName,
			links: ctx.links,
			styles: ctx.styles,
			logging: env.logging,
			markdown: env.markdown,
			mode: env.mode,
			origin: ctx.origin,
			params,
			props,
			pathname: ctx.pathname,
			propagation: ctx.propagation,
			resolve: env.resolve,
			renderers: env.renderers,
			request: ctx.request,
			site: env.site,
			scripts: ctx.scripts,
			ssr: env.ssr,
			status: ctx.status ?? 200,
		});
		const output = await renderComponentToIterable(
			result,
			Component.name ?? 'Component',
			Component,
			props,
			slots
		);
		if (typeof output !== 'string' && Symbol.asyncIterator in output) {
			let parts = new HTMLParts();
			for await (const chunk of output) {
				parts.append(chunk, result);
			}
			return parts.toString();
		}
		return String(output);
	}
}
