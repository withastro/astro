import { execa } from 'execa';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

const GITHUB_SHA = process.env.GITHUB_SHA || execa.sync('git', ['rev-parse', 'HEAD']).stdout; // process.env.GITHUB_SHA will be set in CI; if testing locally execa() will gather this
const FIXTURES_DIR = path.join(fileURLToPath(path.dirname(import.meta.url)), 'fixtures');
const FIXTURES_URL = pathToFileURL(FIXTURES_DIR + '/');

export { GITHUB_SHA, FIXTURES_DIR, FIXTURES_URL };
