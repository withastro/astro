type CF_Json = import('miniflare').Json;
type CF_Request = import('miniflare').Request;
type CF_Response = import('miniflare').Response;

interface CF_RawConfig {
	/**
	 * The name of your worker. Alphanumeric + dashes only.
	 *
	 * @inheritable
	 */
	name: string | undefined;
	/**
	 * These specify any Workers KV Namespaces you want to
	 * access from inside your Worker.
	 *
	 * To learn more about KV Namespaces,
	 * see the documentation at https://developers.cloudflare.com/workers/learning/how-kv-works
	 *
	 * NOTE: This field is not automatically inherited from the top level environment,
	 * and so must be specified in every named environment.
	 *
	 * @default `[]`
	 * @nonInheritable
	 */
	kv_namespaces: {
		/** The binding name used to refer to the KV Namespace */
		binding: string;
		/** The ID of the KV namespace */
		id: string;
		/** The ID of the KV namespace used during `wrangler dev` */
		preview_id?: string;
	}[];
	/**
	 * A map of environment variables to set when deploying your worker.
	 *
	 * NOTE: This field is not automatically inherited from the top level environment,
	 * and so must be specified in every named environment.
	 *
	 * @default `{}`
	 * @nonInheritable
	 */
	vars: Record<string, string | CF_Json>;
	/**
	 * Specifies D1 databases that are bound to this Worker environment.
	 *
	 * NOTE: This field is not automatically inherited from the top level environment,
	 * and so must be specified in every named environment.
	 *
	 * @default `[]`
	 * @nonInheritable
	 */
	d1_databases: {
		/** The binding name used to refer to the D1 database in the worker. */
		binding: string;
		/** The name of this D1 database. */
		database_name: string;
		/** The UUID of this D1 database (not required). */
		database_id: string;
		/** The UUID of this D1 database for Wrangler Dev (if specified). */
		preview_database_id?: string;
		/** The name of the migrations table for this D1 database (defaults to 'd1_migrations'). */
		migrations_table?: string;
		/** The path to the directory of migrations for this D1 database (defaults to './migrations'). */
		migrations_dir?: string;
		/** Internal use only. */
		database_internal_env?: string;
	}[];
	/**
	 * Specifies R2 buckets that are bound to this Worker environment.
	 *
	 * NOTE: This field is not automatically inherited from the top level environment,
	 * and so must be specified in every named environment.
	 *
	 * @default `[]`
	 * @nonInheritable
	 */
	r2_buckets: {
		/** The binding name used to refer to the R2 bucket in the worker. */
		binding: string;
		/** The name of this R2 bucket at the edge. */
		bucket_name: string;
		/** The preview name of this R2 bucket at the edge. */
		preview_bucket_name?: string;
		/** The jurisdiction that the bucket exists in. Default if not present. */
		jurisdiction?: string;
	}[];
	/**
	 * A list of durable objects that your worker should be bound to.
	 *
	 * For more information about Durable Objects, see the documentation at
	 * https://developers.cloudflare.com/workers/learning/using-durable-objects
	 *
	 * NOTE: This field is not automatically inherited from the top level environment,
	 * and so must be specified in every named environment.
	 *
	 * @default `{bindings:[]}`
	 * @nonInheritable
	 */
	durable_objects: {
		bindings: {
			/** The name of the binding used to refer to the Durable Object */
			name: string;
			/** The exported class name of the Durable Object */
			class_name: string;
			/** The script where the Durable Object is defined (if it's external to this worker) */
			script_name?: string;
			/** The service environment of the script_name to bind to */
			environment?: string;
		}[];
	};
	/**
	 * A list of service bindings that your worker should be bound to.
	 *
	 * For more information about Service bindings, see the documentation at
	 * https://developers.cloudflare.com/workers/configuration/bindings/about-service-bindings/
	 *
	 * NOTE: This field is not automatically inherited from the top level environment,
	 * and so must be specified in every named environment.
	 *
	 * @default `[]`
	 * @nonInheritable
	 */
	services: {
		binding: string;
		service: string;
	}[];
}

interface CF_ServiceDesignator {
	name: string;
	env?: string;
}

type CF_ServiceFetch = (request: CF_Request) => Promise<CF_Response> | CF_Response;

type CF_File<Contents = string> =
	| { path: string } // `path` resolved relative to cwd
	| { contents: Contents; path?: string }; // `contents` used instead, `path` can be specified if needed e.g. for module resolution
type CF_BinaryFile = CF_File<Uint8Array>; // Note: Node's `Buffer`s are instances of `Uint8Array`
