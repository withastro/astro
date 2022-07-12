/// <reference types="astro/client" />

interface ImportMetaEnv {
	readonly DB_PASSWORD: string;
	readonly PUBLIC_SOME_KEY: string;
}

interface ImportMeta {
	readonly env: ImportMetaEnv;
}
