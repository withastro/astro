export interface LoggerHandlerConfig {
	/** Serializable options used by the driver implementation */
	config?: Record<string, any> | undefined;
	/** URL or package import */
	entrypoint: string;
}
