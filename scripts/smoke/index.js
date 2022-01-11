import fs from 'fs';
import { execa } from 'execa';
import { fileURLToPath } from 'url';

// NOTE: Only needed for Windows, due to a Turbo bug.
// Once Turbo works on Windows, we can remove this script
// and update our CI to run through Turbo.

export default async function run() {
	const examplesUrl = new URL('../../examples/', import.meta.url);
	const examplesToTest = fs
		.readdirSync(examplesUrl)
		.map((filename) => new URL(filename, examplesUrl))
		.filter((fileUrl) => fs.statSync(fileUrl).isDirectory());
	const allProjectsToTest = [...examplesToTest, new URL('../../docs', import.meta.url)];

	console.log('');
	for (const projectToTest of allProjectsToTest) {
		const filePath = fileURLToPath(projectToTest);
		console.log('  🤖 Testing', filePath, '\n');
		try {
			await execa('yarn', ['build'], { cwd: fileURLToPath(projectToTest), stdout: 'inherit', stderr: 'inherit' });
		} catch (err) {
			console.log(err);
			process.exit(1);
		}
		console.log('\n  🤖 Test complete.');
	}
}

run();
