import { execa } from 'execa';

const api = execa('npm', ['run', 'dev-api']);
api.stdout.pipe(process.stdout);
api.stderr.pipe(process.stderr);

const build = execa('yarn', ['astro', 'build', '--experimental-ssr']);
build.stdout.pipe(process.stdout);
build.stderr.pipe(process.stderr);
await build;

api.kill();
