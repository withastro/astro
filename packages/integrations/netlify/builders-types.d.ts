interface NetlifyLocals {
	runtime: {
		/**
		 * On-demand Builders support an optional time to live (TTL) pattern that allows you to set a fixed duration of time after which a cached builder response is invalidated. This allows you to force a refresh of a builder-generated response without a new deploy.
		 * @param ttl time to live, in seconds
		 */
		setBuildersTtl(ttl: number): void;
	};
}
