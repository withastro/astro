import { addIntegrationToConfig } from './config/add.js';
import { bgGreen, green, black, bgCyan, cyan } from 'kleur';

async function run() {
  const [command, ...args] = process.argv.splice(2);
  if (command !== 'add') return;
	if (!args.length) return;
	for (const name of args) {
		await addIntegrationToConfig({ name, package: `@astrojs/${name}` });
		// TODO: add integration to devDependencies and add peerDependencies as dependencies
		console.log(
			`\n  ${bgGreen(black(' success '))} Added ${cyan(name)} integration`
		);
	}
	// console.log(
	// 	`\n  ${bgCyan(black(' next '))} run ${green('npm install')}`
	// );
}

run();
