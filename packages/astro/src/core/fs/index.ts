import fs from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

const isWindows = (process.platform === "win32");

/** An fs utility, similar to `rimraf` or `rm -rf` */
export function removeDir(_dir: URL): void {
	const dir = fileURLToPath(_dir);
	fs.rmSync(dir, { recursive: true, force: true, maxRetries: 3 });
}

export function emptyDir(_dir: URL, skip?: Set<string>): void {
	const dir = fileURLToPath(_dir);
	if (!fs.existsSync(dir)) return undefined;
	for (const file of fs.readdirSync(dir)) {
		if (skip?.has(file)) {
			continue;
		}

		const p = path.resolve(dir, file);
		const rmOptions = { recursive: true, force: true, maxRetries: 3 };

		try {
			fs.rmSync(p, rmOptions);
		} catch(er: any) {
			if (er.code === "ENOENT") {
				return
			}
			// Windows can EPERM on stat.  Life is suffering.
			// From https://github.com/isaacs/rimraf/blob/8c10fb8d685d5cc35708e0ffc4dac9ec5dd5b444/rimraf.js#L294
			if (er.code === "EPERM" && isWindows) {
				fixWinEPERMSync(p, rmOptions, er);
			}
		}
	}
}

// Taken from https://github.com/isaacs/rimraf/blob/8c10fb8d685d5cc35708e0ffc4dac9ec5dd5b444/rimraf.js#L183
const fixWinEPERMSync = (p: string, options: fs.RmDirOptions, er: any) => {
  try {
    fs.chmodSync(p, 0o666);
  } catch (er2: any) {
    if (er2.code === "ENOENT") {
      return;
		}
    else {
      throw er;
		}
  }

  let stats;
  try {
    stats = fs.statSync(p);
  } catch (er3: any) {
    if (er3.code === "ENOENT") {
      return;
		}
    else {
      throw er;
		}
  }

  if (stats.isDirectory()) {
    fs.rmdirSync(p, options);
	}
  else {
    fs.unlinkSync(p);
	}
}
