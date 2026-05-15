import type { SessionDriverConfig } from './types.js';
export declare const sessionDrivers: {
	http: (config?: import('unstorage/drivers/http').HTTPOptions | undefined) => SessionDriverConfig;
	fs: (config?: import('unstorage/drivers/fs').FSStorageOptions | undefined) => SessionDriverConfig;
	azureAppConfiguration: (
		config?:
			| import('unstorage/drivers/azure-app-configuration').AzureAppConfigurationOptions
			| undefined,
	) => SessionDriverConfig;
	azureCosmos: (
		config?: import('unstorage/drivers/azure-cosmos').AzureCosmosOptions | undefined,
	) => SessionDriverConfig;
	azureKeyVault: (
		config?: import('unstorage/drivers/azure-key-vault').AzureKeyVaultOptions | undefined,
	) => SessionDriverConfig;
	azureStorageBlob: (
		config?: import('unstorage/drivers/azure-storage-blob').AzureStorageBlobOptions | undefined,
	) => SessionDriverConfig;
	azureStorageTable: (
		config?: import('unstorage/drivers/azure-storage-table').AzureStorageTableOptions | undefined,
	) => SessionDriverConfig;
	capacitorPreferences: (
		config?:
			| import('unstorage/drivers/capacitor-preferences').CapacitorPreferencesOptions
			| undefined,
	) => SessionDriverConfig;
	cloudflareKVBinding: (
		config?: import('unstorage/drivers/cloudflare-kv-binding').KVOptions | undefined,
	) => SessionDriverConfig;
	cloudflareKVHttp: (
		config?: import('unstorage/drivers/cloudflare-kv-http').KVHTTPOptions | undefined,
	) => SessionDriverConfig;
	cloudflareR2Binding: (
		config?: import('unstorage/drivers/cloudflare-r2-binding').CloudflareR2Options | undefined,
	) => SessionDriverConfig;
	db0: (
		config?: import('unstorage/drivers/db0').DB0DriverOptions | undefined,
	) => SessionDriverConfig;
	denoKVNode: (
		config?: import('unstorage/drivers/deno-kv-node').DenoKvNodeOptions | undefined,
	) => SessionDriverConfig;
	denoKV: (
		config?: import('unstorage/drivers/deno-kv').DenoKvOptions | undefined,
	) => SessionDriverConfig;
	fsLite: (
		config?: import('unstorage/drivers/fs-lite').FSStorageOptions | undefined,
	) => SessionDriverConfig;
	github: (
		config?: import('unstorage/drivers/github').GithubOptions | undefined,
	) => SessionDriverConfig;
	indexedb: (
		config?: import('unstorage/drivers/indexedb').IDBKeyvalOptions | undefined,
	) => SessionDriverConfig;
	localstorage: (
		config?: import('unstorage/drivers/localstorage').LocalStorageOptions | undefined,
	) => SessionDriverConfig;
	lruCache: (
		config?: import('unstorage/drivers/lru-cache').LRUDriverOptions | undefined,
	) => SessionDriverConfig;
	mongodb: (
		config?: import('unstorage/drivers/mongodb').MongoDbOptions | undefined,
	) => SessionDriverConfig;
	netlifyBlobs: (
		config?: import('unstorage/drivers/netlify-blobs').NetlifyStoreOptions | undefined,
	) => SessionDriverConfig;
	overlay: (
		config?: import('unstorage/drivers/overlay').OverlayStorageOptions | undefined,
	) => SessionDriverConfig;
	planetscale: (
		config?: import('unstorage/drivers/planetscale').PlanetscaleDriverOptions | undefined,
	) => SessionDriverConfig;
	redis: (
		config?: import('unstorage/drivers/redis').RedisOptions | undefined,
	) => SessionDriverConfig;
	s3: (config?: import('unstorage/drivers/s3').S3DriverOptions | undefined) => SessionDriverConfig;
	sessionStorage: (
		config?: import('unstorage/drivers/session-storage').SessionStorageOptions | undefined,
	) => SessionDriverConfig;
	uploadthing: (
		config?: import('unstorage/drivers/uploadthing').UploadThingOptions | undefined,
	) => SessionDriverConfig;
	upstash: (
		config?: import('unstorage/drivers/upstash').UpstashOptions | undefined,
	) => SessionDriverConfig;
	vercelBlob: (
		config?: import('unstorage/drivers/vercel-blob').VercelBlobOptions | undefined,
	) => SessionDriverConfig;
	vercelKV: (
		config?: import('unstorage/drivers/vercel-kv').VercelKVOptions | undefined,
	) => SessionDriverConfig;
	vercelRuntimeCache: (
		config?: import('unstorage/drivers/vercel-runtime-cache').VercelCacheOptions | undefined,
	) => SessionDriverConfig;
};
