/**
 * Configures the driver that persists content collections defined with
 * `storage: 'external'`.
 */
export interface ContentStorageDriverConfig<
	TConfig extends Record<string, any> = Record<string, any>,
> {
	/** URL or package import of a module whose default export creates the driver */
	entrypoint: string | URL;
	/** Serializable options passed to the driver factory */
	config?: TConfig;
}
