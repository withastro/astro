export type ContainerRenderer = {
	/**
	 * The name of the renderer.
	 */
	name: string;
	/**
	 * The entrypoint that is used to render a component on the server
	 */
	serverEntrypoint: string;
};
