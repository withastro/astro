declare module 'astro:link' {
	interface Links {
		// @@LINKS@@
	}

	type Prettify<T> = {
		[K in keyof T]: T[K];
	} & {};

	type Opts<T> = Prettify<
		([T] extends [never]
			? {
					params?: never;
				}
			: {
					params: T;
				}) & {
			searchParams?: Record<string, string> | URLSearchParams;
			hash?: string;
		}
	>;

	export function link<TPath extends keyof Links>(
		path: TPath,
		...[opts]: Links[TPath] extends never ? [opts?: Opts<Links[TPath]>] : [opts: Opts<Links[TPath]>]
	): string;
}

// TODO: routePattern
