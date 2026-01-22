// IMPORTANT: do not publish this file!
// It provides typings for internal virtual modules.
// The naming convention is: virtual:astro:<feature>/<...custom>

declare module 'virtual:astro:env/internal' {
	export const schema: import('./src/env/schema.js').EnvSchema;
}

declare module 'virtual:astro:assets/fonts/internal' {
	export const componentDataByCssVariable: import('./src/assets/fonts/types.js').ComponentDataByCssVariable;
	export const fontDataByCssVariable: import('./src/assets/fonts/types.js').FontDataByCssVariable;
	export const bufferImports: import('./src/assets/fonts/types.js').BufferImports;
}

declare module 'virtual:astro:adapter-config/client' {
	export const internalFetchHeaders: Record<string, string>;
}

declare module 'virtual:astro:actions/options' {
	export const shouldAppendTrailingSlash: boolean;
}

declare module 'virtual:astro:actions/runtime' {
	export * from './src/actions/runtime/client.js';
}
