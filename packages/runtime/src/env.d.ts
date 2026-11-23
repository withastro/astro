// The client router reads `import.meta.env.DEV`, which Vite replaces when it bundles the router.
interface ImportMeta {
	readonly env: { readonly DEV: boolean };
}
