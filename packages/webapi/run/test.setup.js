import { fork as nodeFork, spawn as nodeSpawn } from 'child_process'
import { fileURLToPath } from 'url'

export { strict as assert } from 'assert'

export const args = () => process.argv.slice(2).reduce(
	(argo, arg) => {
		if (arg.startsWith('-')) {
			argo.opts[argo.prop = arg] = []
		} else if (argo.prop) {
			argo.opts[argo.prop].push(arg)
		} else {
			argo.paths.push(arg)
		}

		return argo
	},
	{ opts: {}, paths: [] }
)

export const fork = (...args) => new Promise((resolve, reject) => {
	const child = nodeFork(...args)

	child.on('error', reject)
	child.on('exit', resolve)
})

export const spawn = (...args) => new Promise((resolve, reject) => {
	const child = nodeSpawn(...args)

	child.on('error', reject)
	child.on('exit', resolve)
})

export const pathFrom = (...args) => fileURLToPath(args.reduce((url, bit) => new URL(bit, url), new URL('file:')))

export const test = async (setup) => {
	console.log(`Testing Node ${process.version}:`)
	console.log('')

	for (const test of setup()) {
		try {
			console.log(`- ${test.name}`)

			await test.test()
		} catch (error) {
			console.error(error)

			process.exit(1)
		}
	}

	console.log('')
	console.log('Pass!')
	console.log('')

	process.exit(0)
}
