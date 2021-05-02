import 'source-map-support/register.js';
import { promises as fs } from 'fs';
import { resolve } from 'path';
import decompress from 'decompress';
import { fileURLToPath, URL } from 'url';
import { join } from 'path';

const log = (...args) => console.log(' ', ...args);
export default async function createAstro(argv) {
    const [name] = argv.slice(2);
    const templateRoot = fileURLToPath(new URL('../create-astro/templates', import.meta.url));
    if (!name) {
        log();
        log(`npm init astro <dest>`);
        log(`Provide a destination!`);
        process.exit(0);
    }

    log();
    const dest = resolve(process.cwd(), name);
    const relDest = name.slice(0, 2) === './' ? name : `./${name}`;
    if (isEmpty(relDest)) {
        await decompress(await fs.readFile(join(templateRoot, 'starter.tar.gz')), dest);
        log(`Your Astro project has been scaffolded at "${relDest}"`);
        log();
        log(`Next steps:`);
        log();
        log(`  cd ${relDest}`);
        log(`  npm install`);
        log(`  npm run start`);
    }
}

function isEmpty(path) {
    try {
        const files = fs.readdirSync(resolve(process.cwd(), path));
        if (files.length > 0) {
            log(`It looks like "${path}" isn't empty!`);
            return false;
        } else {
            log(`Scaffolding Astro project at "${path}"`);
            return true;
        }
    } catch (err) {
        if (err.code !== 'ENOENT') throw err;
    }
    return true;
}
