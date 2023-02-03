import { polyfill } from './mod.js'

export * from './mod.js'

polyfill(globalThis, {
	exclude: 'window document',
})
