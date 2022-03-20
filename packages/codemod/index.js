import { addIntegrationToConfig } from './config/add.js';

async function run() {
  const [add, name] = process.argv.splice(2);
  if (add !== 'add') return;
	if (!name) return;
  await addIntegrationToConfig({ name, package: `@astrojs/${name}` });
  console.log(
    `\n  ${bgGreen(black(' success '))} Added ${cyan(name)} integration`
  );
}

run();
