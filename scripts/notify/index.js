const path = require('path');
const baseUrl = new URL('https://github.com/withastro/astro/blob/main/');

async function run() {
  const releases = process.argv.slice(2)[0];
  const data = JSON.parse(releases);
  const packages = await Promise.all(
    data.map(({ name, version }) => {
      const p = path.relative('./', path.dirname(require.resolve(name))).replace(path.sep, '/');
      return { name, version, url: new URL(`${p}/CHANGELOG.md#${version.replace(/\./g, '')}`, baseUrl).toString() };
    })
  );

  if (packages.length === 1) {
    const { name, version, url } = packages[0];
    console.log(`\`${name}@${version}\` was just released! Read the [release notes →](<${url}>)`);
  } else {
    console.log(`**Some new releases just went out!**\n`);
    for (const { name, version, url } of packages) {
      console.log(`  • \`${name}@${version}\` ([Release Notes →](<${url}>))`);
    }
  }
}

run();
