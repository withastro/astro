/** @todo migrate these to use the independent docs repository at https://github.com/withastro/docs */

import fs from 'fs';
import { execa } from 'execa';
import { fileURLToPath } from 'url';
import path from 'path';

// NOTE: Only needed for Windows, due to a Turbo bug.
// Once Turbo works on Windows, we can remove this script
// and update our CI to run through Turbo.

const astroBinLocation = new URL('../../node_modules/.bin/astro', import.meta.url);

/** Returns the parsed package.json of the given directory. */
const readDirectoryPackage = async (/** @type {URL} */ dir) => JSON.parse(await fs.readFileSync(new URL('package.json', dir + '/'), 'utf-8'));

/** Returns upon completion of writing a package.json to the given directory. */
const writeDirectoryPackage = async (/** @type {URL} */ dir, /** @type {any} */ data) =>
	await fs.writeFileSync(new URL('package.json', dir + '/'), JSON.stringify(data, null, '  ') + '\n');


export default async function run() {
	const examplesUrl = new URL('../../examples/', import.meta.url);
	const examplesToTest = fs
		.readdirSync(examplesUrl)
		.map((filename) => new URL(filename, examplesUrl))
		.filter((fileUrl) => fs.statSync(fileUrl).isDirectory());
	const allProjectsToTest = [/*...examplesToTest,*/ await gitCloneExample('www', `git@github.com:withastro/astro.build.git`),  await gitCloneExample('docs', `git@github.com:withastro/docs.git`),  ];

	console.log('');
	for (const projectToTest of allProjectsToTest) {
		const filePath = fileURLToPath(projectToTest);
		console.log('  🤖 Testing', filePath, '\n');
		try {
			if (filePath.includes('examples-smoke')) {
				await execa('node', [fileURLToPath(astroBinLocation), 'build'], { cwd: fileURLToPath(projectToTest), stdout: 'inherit', stderr: 'inherit' });
			} else {
				await execa('yarn', ['build'], { cwd: fileURLToPath(projectToTest), stdout: 'inherit', stderr: 'inherit' });
			}
		} catch (err) {
			console.log(err);
			process.exit(1);
		}
		console.log('\n  🤖 Test complete.');
	}
}

run();

/** URL directory containing the entire project. */
const rootDir = new URL('../../', import.meta.url);

/** URL directory containing the example subdirectories. */
const exampleDir = new URL('examples/', rootDir);

/** URL directory containing the Astro package. */
const astroDir = new URL('packages/astro/', rootDir);

async function gitCloneExample(id, cloneUrl) {
	const smokeExamplesUrl = new URL('../../examples-smoke/', import.meta.url);
	const clonedRepoUrl = new URL(`../../examples-smoke/${id}`, import.meta.url);
	console.log('link:'+fileURLToPath(new URL('../../packages/astro', import.meta.url)));
	// try {
	// 	fs.statSync(clonedRepoUrl);
	// } catch (err) {
	// 	await execa('git', ['clone', cloneUrl, id], { cwd: fileURLToPath(smokeExamplesUrl), stdout: 'inherit', stderr: 'inherit' });
	// }
	// await execa('git', ['fetch', 'origin'], { cwd: fileURLToPath(smokeExamplesUrl), stdout: 'inherit', stderr: 'inherit' });
	// await execa('git', ['checkout', 'main'], { cwd: fileURLToPath(smokeExamplesUrl), stdout: 'inherit', stderr: 'inherit' });
	// await execa('git', ['reset', 'origin/main', '--hard'], { cwd: fileURLToPath(smokeExamplesUrl), stdout: 'inherit', stderr: 'inherit' });

	// const astroPackage = await readDirectoryPackage(astroDir);
	// const githubPackage = await readDirectoryPackage(clonedRepoUrl);
	// if ('astro' in Object(githubPackage.dependencies)) { 
	// 	githubPackage.dependencies['astro'] = astroPackage.version;
	// }
	// if ('astro' in Object(githubPackage.devDependencies)) {
	// 	githubPackage.devDependencies['astro'] = astroPackage.version;
	// }
	// if ('astro' in Object(githubPackage.peerDependencies)) {
	// 	githubPackage.peerDependencies['astro'] = astroPackage.version;
	// }
	// await writeDirectoryPackage(clonedRepoUrl, githubPackage);

	// await execa('yarn', [], { cwd: fileURLToPath(clonedRepoUrl), stdout: 'inherit', stderr: 'inherit' });
	return clonedRepoUrl; 
}