/* eslint-disable no-console */
// Example:
// $ astro db deploy

export async function cmd() {
	console.log('TODO!');
	console.log('');
	console.log('This will one day become an alias for:');
	console.log('  $ astro db snapshot --target=production > base_schema.json');
	console.log('  $ astro db snapshot --target=local > local_schema.json');
	console.log(
		'  $ astro db diff --from base_schema.json --to local_schema.json --format migrate > migrate.js'
	);
	console.log('  $ astro db run --script migrate.js');
	console.log('Until then, please run each step individually in your terminal.');
	console.log('Remember: these scripts require valid env tokens to authenticate!');
	console.log('');
	process.exit(0);
}
