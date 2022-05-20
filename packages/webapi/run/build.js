import { rollup } from 'rollup'
import { nodeResolve } from '@rollup/plugin-node-resolve'
import path from 'node:path'
import { createRequire } from 'node:module'
import {
	readFile as nodeReadFile,
	rename,
	rm,
	writeFile,
} from 'node:fs/promises'
import { default as MagicString } from 'magic-string'
import { default as alias } from '@rollup/plugin-alias'
import { default as inject } from '@rollup/plugin-inject'
import { default as typescript } from '@rollup/plugin-typescript'

const readFileCache = Object.create(null)
const require = createRequire(import.meta.url)

const readFile = (/** @type {string} */ id) =>
	readFileCache[id] || (readFileCache[id] = nodeReadFile(id, 'utf8'))

const pathToDOMException = path.resolve('src', 'lib', 'DOMException.js')
const pathToEventTargetShim = path.resolve(
	'node_modules',
	'event-target-shim',
	'index.mjs'
)
const pathToStructuredClone = path.resolve(
	'node_modules',
	'@ungap',
	'structured-clone',
	'esm',
	'index.js'
)

const plugins = [
	typescript({
		tsconfig: './tsconfig.json',
	}),
	alias({
		entries: [
			{ find: '@ungap/structured-clone', replacement: pathToStructuredClone },
			{ find: 'event-target-shim', replacement: pathToEventTargetShim },
			{
				find: 'event-target-shim/dist/event-target-shim.js',
				replacement: pathToEventTargetShim,
			},
			{
				find: 'event-target-shim/dist/event-target-shim.umd.js',
				replacement: pathToEventTargetShim,
			},
			{ find: 'node-domexception', replacement: pathToDOMException },
		],
	}),
	nodeResolve({
		dedupe: ['net', 'node:net'],
	}),
	inject({
		// import { Promise as P } from 'es6-promise'
		// P: [ 'es6-promise', 'Promise' ],

		AbortController: [
			'abort-controller/dist/abort-controller.mjs',
			'AbortController',
		],
		Blob: ['fetch-blob/from.js', 'Blob'],
		DOMException: [pathToDOMException, 'DOMException'],
		Document: ['./Document', 'Document'],
		Element: ['./Element', 'Element'],
		Event: ['event-target-shim', 'Event'],
		EventTarget: ['event-target-shim', 'EventTarget'],
		defineEventAttribute: ['event-target-shim', 'defineEventAttribute'],
		HTMLElement: ['./Element', 'HTMLElement'],
		HTMLImageElement: ['./Element', 'HTMLImageElement'],
		HTMLUnknownElement: ['./Element', 'HTMLUnknownElement'],
		MediaQueryList: ['./MediaQueryList', 'MediaQueryList'],
		Node: ['./Node', 'Node'],
		ReadableStream: [
			'web-streams-polyfill/dist/ponyfill.es6.mjs',
			'ReadableStream',
		],
		ShadowRoot: ['./Node', 'ShadowRoot'],
		Window: ['./Window', 'Window'],
		'globalThis.ReadableStream': [
			'web-streams-polyfill/dist/ponyfill.es6.mjs',
			'ReadableStream',
		],
	}),
	{
		async load(id) {
			const pathToEsm = id
			const pathToMap = `${pathToEsm}.map`

			const code = await readFile(pathToEsm, 'utf8')

			const indexes = []

			const replacements = [
				// remove unused imports
				[/(^|\n)import\s+[^']+'node:(buffer|fs|path|worker_threads)'/g, ``],
				[/const \{ stat \} = fs/g, ``],

				// remove unused polyfill utils
				[/\nif \(\s*typeof Global[\W\w]+?\n\}/g, ``],
				[/\nif \(\s*typeof window[\W\w]+?\n\}/g, ``],
				[/\nif \(!globalThis\.ReadableStream\) \{[\W\w]+?\n\}/g, ``],
				[/\nif \(typeof SymbolPolyfill[\W\w]+?\n\}/g, ``],

				// remove unused polyfills
				[/\nconst globals = getGlobals\(\);/g, ``],
				[/\nconst queueMicrotask = [\W\w]+?\n\}\)\(\);/g, ``],
				[/\nconst NativeDOMException =[^;]+;/g, ``],
				[
					/\nconst SymbolPolyfill\s*=[^;]+;/g,
					'\nconst SymbolPolyfill = Symbol;',
				],
				[
					/\n(const|let) DOMException[^;]*;/g,
					`let DOMException$1=DOMException`,
				],
				[/\nconst DOMException = globalThis.DOMException[\W\w]+?\}\)\(\)/g, ``],
				[/\nimport DOMException from 'node-domexception'/g, ``],

				// use shared AbortController methods
				[/ new DOMException\$1/g, `new DOMException`],
				[/ from 'net'/g, `from 'node:net'`],
				[/ throw createInvalidStateError/g, `throw new DOMException`],
				[/= createAbortController/g, `= new AbortController`],
				[/\nconst queueMicrotask = [\W\w]+?\n\}\)\(\)\;/g, ``],

				// remove Body.prototype.buffer deprecation notice
				[/\nBody\.prototype\.buffer[^\n]+/g, ``],

				// remove Body.prototype.data deprecation notice
				[/\n	data: \{get: deprecate[\W\w]+?\)\}/g, ``],
			]

			for (const [replacee, replacer] of replacements) {
				replacee.index = 0

				let replaced = null

				while ((replaced = replacee.exec(code)) !== null) {
					const leadIndex = replaced.index
					const tailIndex = replaced.index + replaced[0].length

					indexes.unshift([leadIndex, tailIndex, replacer])
				}
			}

			if (indexes.length) {
				const magicString = new MagicString(code)

				indexes.sort(([leadOfA], [leadOfB]) => leadOfA - leadOfB)

				for (const [leadIndex, tailindex, replacer] of indexes) {
					magicString.overwrite(leadIndex, tailindex, replacer)
				}

				const magicMap = magicString.generateMap({
					source: pathToEsm,
					file: pathToMap,
					includeContent: true,
				})

				const modifiedEsm = magicString.toString()
				const modifiedMap = magicMap.toString()

				return { code: modifiedEsm, map: modifiedMap }
			}
		},
	},
]

async function build() {
	const configs = [
		{
			inputOptions: {
				input: 'src/polyfill.ts',
				plugins: plugins,
				external: ['node-fetch'],
				onwarn(warning, warn) {
					if (warning.code !== 'UNRESOLVED_IMPORT') warn(warning)
				},
			},
			outputOptions: {
				inlineDynamicImports: true,
				file: 'mod.js',
				format: 'esm',
				sourcemap: true,
			},
		},
	]

	for (const config of configs) {
		const bundle = await rollup(config.inputOptions)

		// or write the bundle to disk
		await bundle.write(config.outputOptions)

		// closes the bundle
		await bundle.close()

		// delete the lib directory
		await rm('lib', { force: true, recursive: true })
		await rm('exclusions.d.ts', { force: true, recursive: true })
		await rm('exclusions.d.ts.map', { force: true, recursive: true })
		await rm('inheritence.d.ts', { force: true, recursive: true })
		await rm('inheritence.d.ts.map', { force: true, recursive: true })
		await rm('polyfill.d.ts.map', { force: true, recursive: true })
		await rm('polyfill.js.map', { force: true, recursive: true })
		await rm('polyfill.js', { force: true, recursive: true })
		await rm('ponyfill.d.ts', { force: true, recursive: true })
		await rm('ponyfill.d.ts.map', { force: true, recursive: true })
		await rm('ponyfill.js.map', { force: true, recursive: true })
		await rm('ponyfill.js', { force: true, recursive: true })

		await rename('polyfill.d.ts', 'mod.d.ts')

		const modDTS = await readFile('./mod.d.ts')

		writeFile(
			'mod.d.ts',
			modDTS
				.replace('\n//# sourceMappingURL=polyfill.d.ts.map', '')
				.replace('ponyfill.js', 'mod.js')
		)
		writeFile(
			'apply.js',
			`import { polyfill } from './mod.js'\n\nexport * from './mod.js'\n\npolyfill(globalThis)\n`
		)
	}
}

build()
