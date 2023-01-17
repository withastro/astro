/// <reference types="astro/client" />

interface ImportMetaEnv {
	readonly GITHUB_TOKEN: string | undefined;
}

interface ImportMeta {
	readonly env: ImportMetaEnv;
}
