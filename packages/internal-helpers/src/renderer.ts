interface OptimizeDeps {
	include?: string[];
	exclude?: string[];
}

/** The fields of an Astro renderer that name modules. */
interface RendererModuleIds {
	clientEntrypoint?: string | URL;
	serverEntrypoint: string | URL;
	optimizeDeps?: { client?: OptimizeDeps; server?: OptimizeDeps };
	noExternal?: string[] | ((context: { root: URL }) => string[] | Promise<string[]>);
}

/**
 * Returns `renderer` with the modules of `rendererPackage` named by the same subpaths of
 * `integrationPackage`, which re-exports them: an Astro project depends on the integration and may
 * not resolve the renderer package, as pnpm does not hoist it. Ids excluded from `optimizeDeps` are
 * excluded under both names, and a `noExternal` renderer package makes the integration `noExternal`.
 */
export function reexportRenderer<T extends RendererModuleIds>(
	renderer: T,
	rendererPackage: string,
	integrationPackage: string,
): T {
	const toIntegration = (id: string) => {
		if (id.startsWith(`${rendererPackage}/`))
			return integrationPackage + id.slice(rendererPackage.length);
		// The `optimizeDeps` syntax for a dependency of a dependency.
		if (id.startsWith(`${rendererPackage} > `)) return `${integrationPackage} > ${id}`;
		return id;
	};
	const toIntegrationDeps = (deps: OptimizeDeps | undefined): OptimizeDeps | undefined =>
		deps && {
			...(deps.include && { include: deps.include.map(toIntegration) }),
			...(deps.exclude && {
				exclude: [...new Set([...deps.exclude.map(toIntegration), ...deps.exclude])],
			}),
		};
	const { clientEntrypoint, serverEntrypoint, optimizeDeps, noExternal } = renderer;
	return {
		...renderer,
		clientEntrypoint:
			typeof clientEntrypoint === 'string' ? toIntegration(clientEntrypoint) : clientEntrypoint,
		serverEntrypoint:
			typeof serverEntrypoint === 'string' ? toIntegration(serverEntrypoint) : serverEntrypoint,
		...(optimizeDeps && {
			optimizeDeps: {
				client: toIntegrationDeps(optimizeDeps.client),
				server: toIntegrationDeps(optimizeDeps.server),
			},
		}),
		...(Array.isArray(noExternal) &&
			noExternal.includes(rendererPackage) && { noExternal: [integrationPackage, ...noExternal] }),
	};
}
