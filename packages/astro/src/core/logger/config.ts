export interface LoggerHandlerConfig {
	/** Serializable options used by the driver implementation */
	config?: Record<string, any> | undefined;
	/** A package import, a path relative to the project root, or a URL */
	entrypoint: string | URL;
}
