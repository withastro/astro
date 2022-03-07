import { fileURLToPath } from 'url'

export { strict as assert } from 'assert'

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
