import { args, pathFrom, spawn } from './test.setup.js'

const pathToRoot = pathFrom(import.meta.url, '../')
const pathToTest = pathFrom(import.meta.url, './test.all.js')

const test = async () => {
	const { opts } = args()

	if (!opts['--node']) opts['--node'] = [ '12', '14', '16' ]

	for (const version of opts['--node']) {
		await spawn('volta', ['run', '--node', version, 'node', pathToTest, ...process.argv.slice(2)], { cwd: pathToRoot, env: { ...process.env }, stdio: 'inherit' })
	}
}

test()
