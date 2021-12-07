import path from 'path';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const baseUrl = new URL('https://github.com/withastro/astro/blob/main/');

const emojis = ['🎉', '🥳', '🚀', '🧑‍🚀', '🎊', '🏆', '✅', '🤩', '🤖', '🙌'];
const descriptors = ['new releases', 'hot and fresh updates', 'shiny updates', 'exciting changes', 'package updates', 'awesome updates', 'bug fixes and features', 'updates'];
const verbs = [
  'just went out!',
  'just launched!',
  'now available!',
  'in the wild!',
  'now live!',
  'hit the registry!',
  'to share!',
  'for you!',
  'for y’all! 🤠',
  'comin’ your way!',
  'comin’ atcha!',
  'comin’ in hot!',
  'freshly minted on the blockchain! (jk)',
  '[is] out (now with 100% more reticulated splines!)',
  '(as seen on TV!)',
  'just dropped!',
  '– artisanally hand-crafted just for you.',
  '– oh happy day!',
  '– enjoy!',
  'now out. Be the first on your block to download!',
  'made with love 💕',
  '[is] out! Our best [version] yet!',
  '[is] here. DOWNLOAD! DOWNLOAD! DOWNLOAD!',
  '... HUZZAH!',
  '[has] landed!',
  'landed! The internet just got a little more fun.',
  '– from our family to yours.',
  '– go forth and build!',
];

function item(items) {
  return items[Math.floor(Math.random() * items.length)];
}

const plurals = new Map([
  ['is', 'are'],
  ['has', 'have']
])

function pluralize(text) {
  return text.replace(/(\[([^\]]+)\])/gm, (_, _full, match) => plurals.has(match) ? plurals.get(match) : `${match}s`)
}

function singularlize(text) {
  return text.replace(/(\[([^\]]+)\])/gm, (_, _full, match) => `${match}`)
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
    console.log(`${emoji} \`${name}@${version}\` ${singularlize(verb)}\nRead the [release notes →](<${url}>)`);
  } else {
    console.log(`${emoji} Some ${descriptor} ${pluralize(verb)}\n`);
    for (const { name, version, url } of packages) {
      console.log(`• \`${name}@${version}\` Read the [release notes →](<${url}>)`);
    }
  }
}

run();
