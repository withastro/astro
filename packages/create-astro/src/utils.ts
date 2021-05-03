import { ChildProcess, spawn } from 'child_process';
import { promises as fs, readdirSync, existsSync, lstatSync, rmdirSync, unlinkSync } from 'fs';
import { basename, resolve } from 'path';
import { fileURLToPath, URL } from 'url';
import decompress from 'decompress';

const listeners = new Map();

export async function addProcessListeners(handlers: [NodeJS.Signals|string, NodeJS.SignalsListener][]) {
  for (const [event,handler] of handlers) {
    listeners.set(event, handler);
    process.once(event as NodeJS.Signals, handler);
  }
}

export async function cancelProcessListeners() {
  for (const [event, handler] of listeners.entries()) {
    process.off(event, handler);
    listeners.delete(event);
  }
}

export async function getTemplates() {
    const templatesRoot = fileURLToPath(new URL('./templates', import.meta.url));
    const templateFiles = await fs.readdir(templatesRoot, 'utf8');
    const templates = templateFiles.filter(t => t.endsWith('.tgz'));
    const metafile = templateFiles.find(t => t.endsWith('meta.json'));

    const meta = await fs.readFile(resolve(templatesRoot, metafile)).then(r => JSON.parse(r.toString()));

    return templates.map(template => {
      const value = basename(template, '.tgz');
      if (meta[value]) return { ...meta[value], value };
      return { value };
    }).sort((a, b) => {
      const aRank = a.rank ?? 0;
      const bRank = b.rank ?? 0;
      if (aRank > bRank) return -1;
      if (bRank > aRank) return 1;
      return 0;
    });
}

const childrenProcesses: ChildProcess[] = [];
export let isDone = false;

export async function rewriteFiles(projectName: string) {
  const dest = resolve(projectName);
  const tasks = [];
  tasks.push(fs.rename(resolve(dest, '_gitignore'), resolve(dest, '.gitignore')));
  tasks.push(
    fs.readFile(resolve(dest, 'package.json'))
      .then(res => JSON.parse(res.toString()))
      .then(json => JSON.stringify({ ...json, name: getValidPackageName(projectName) }, null, 2))
      .then(res => fs.writeFile(resolve(dest, 'package.json'), res))
  );

  return Promise.all(tasks);
}

export async function prepareTemplate(use: 'npm'|'yarn', name: string, dest: string) {
    const projectName = dest;
    dest = resolve(dest);
    const template = fileURLToPath(new URL(`./templates/${name}.tgz`, import.meta.url));
    await decompress(template, dest);
    await rewriteFiles(projectName);
    try {
      await run(use, use === 'npm' ? 'i' : null, dest);
    } catch (e) {
      cleanup(true);
    }
    isDone = true;
    return;
}

export function cleanup(didError = false) {
  killChildren();
  setTimeout(() => {
    process.exit(didError ? 1 : 0);
  }, 200);
}

export function killChildren() {
  childrenProcesses.forEach(p => p.kill('SIGINT'));
}

export function run(pkgManager: 'npm'|'yarn', command: string, projectPath: string, stdio: any = 'ignore'): Promise<void> {
  return new Promise((resolve, reject) => {
    const p = spawn(pkgManager, command ? [command] : [], {
      shell: true,
      stdio,
      cwd: projectPath,
    });
    p.once('exit', () => resolve());
    p.once('error', reject);
    childrenProcesses.push(p);
  });
}

export function isWin() {
  return process.platform === 'win32';
}

export function isEmpty(path) {
    try {
        const files = readdirSync(resolve(path));
        if (files.length > 0) {
            return false;
        } else {
            return true;
        }
    } catch (err) {
        if (err.code !== 'ENOENT') throw err;
    }
    return true;
}

export function emptyDir(dir) {
  dir = resolve(dir);
  if (!existsSync(dir)) {
    return
  }
  for (const file of readdirSync(dir)) {
    const abs = resolve(dir, file)
    if (lstatSync(abs).isDirectory()) {
      emptyDir(abs)
      rmdirSync(abs)
    } else {
      unlinkSync(abs)
    }
  }
}

export function getValidPackageName(projectName: string) {
  const packageNameRegExp = /^(?:@[a-z0-9-*~][a-z0-9-*._~]*\/)?[a-z0-9-~][a-z0-9-._~]*$/

  if (packageNameRegExp.test(projectName)) {
    return projectName
  }

  return projectName
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/^[._]/, '')
    .replace(/[^a-z0-9-~]+/g, '-');
}
