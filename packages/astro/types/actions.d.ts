declare module 'astro:actions' {
	export {
		/** @deprecated Import `z` from `astro:schema` instead. */
		z,
	} from 'astro/zod';
	export * from 'astro/actions/runtime/virtual/server.js';
}
