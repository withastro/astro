import path from 'path';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const baseUrl = new URL('https://github.com/withastro/astro/blob/main/');

const emojis = ['🎉', '🥳', '🚀', '🧑‍🚀', '🎊', '🏆', '✅', '🤩', '🤖', '🙌'];
const descriptors = ['new releases', 'fresh new code', 'shiny updates', 'exciting stuff', 'package updates', 'awesome updates', 'bug fixes and features', 'updates'];
const verbs = [
  'just went out!',
  'just launched!',
  'now available!',
  'in the wild!',
  'now live!',
  'hit the registry!',
  'to share!',
  'for you!',
  'for y’all!',
  'comin’ your way!',
  'comin’ atcha!',
  'comin’ in hot!',
  ', freshly minted on the blockchain! (jk)',
  ', now with 100% more reticulated splines!',
  '(as seen on TV!)',
  'just dropped!',
  ', artisanally hand-crafted just for you.',
  ', oh happy day!',
  '—enjoy!',
  '(be the first on your block to download it!)',
  ', made with love',
  ', our best version yet!',
  'DOWNLOAD! DOWNLOAD! DOWNLOAD!',
  '! HUZZAH!',
  'has landed!',
  '! The internet just got a little more fun.',
  ', from our family to yours.',
  ', go forth and build!',
];

function item(items) {
  return items[Math.floor(Math.random() * items.length)];
}

async function run() {
  const releases = process.argv.slice(2)[0];
  const data = JSON.parse(releases);
  const packages = await Promise.all(
    data.map(({ name, version }) => {
      const p = path.relative('./', path.dirname(require.resolve(name))).replace(path.sep, '/');
      return { name, version, url: new URL(`${p}/CHANGELOG.md#${version.replace(/\./g, '')}`, baseUrl).toString() };
    })
  );

  const emoji = item(emojis);
  const descriptor = item(descriptors);
  const verb = item(verbs);

  if (packages.length === 1) {
    const { name, version, url } = packages[0];
    console.log(`${emoji} \`${name}@${version}\` ${verb}\nRead the [release notes →](<${url}>)`);
  } else {
    console.log(`${emoji} Some ${descriptor} ${verb}\n`);
    for (const { name, version, url } of packages) {
      console.log(`• \`${name}@${version}\` Read the [release notes →](<${url}>)`);
    }
  }
}

run();
