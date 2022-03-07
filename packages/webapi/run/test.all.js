import { promises as fs } from 'node:fs'
import { args, fork, pathFrom } from './test.setup.js'

const test = async () => {
	const { opts } = args()

	if (!opts['--only']) opts['--only'] = '.+'

	const only = new RegExp(opts['--only'], 'i')

	const testDir = pathFrom(import.meta.url, '../test/')

	for await (const dirent of await fs.opendir(testDir)) {
		if (only.test(dirent.name)) {
			await fork(pathFrom(testDir, dirent.name))
		}
	}
}

test()
