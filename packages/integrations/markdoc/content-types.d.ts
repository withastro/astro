declare module 'astro:content' {
	type ComponentRenderer =
		| JSX.Element
		| {
				component: JSX.Element;
				props?(params: {
					attributes: Record<string, any>;
					getTreeNode(): import('@markdoc/markdoc').Tag;
				}): Record<string, any>;
		  };
	interface Render {
		'.mdoc': {
			Content(props: {
				components: Record<string, ComponentRenderer>;
				config: import('@markdoc/markdoc').Config;
			}): Promise<JSX.Element>;
		};
	}
}
