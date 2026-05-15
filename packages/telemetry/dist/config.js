import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import process from 'node:process';
import { dset } from 'dset';
function getConfigDir(name) {
	const homedir = os.homedir();
	const macos = () => path.join(homedir, 'Library', 'Preferences', name);
	const win = () => {
		const { APPDATA = path.join(homedir, 'AppData', 'Roaming') } = process.env;
		return path.join(APPDATA, name, 'Config');
	};
	const linux = () => {
		const { XDG_CONFIG_HOME = path.join(homedir, '.config') } = process.env;
		return path.join(XDG_CONFIG_HOME, name);
	};
	switch (process.platform) {
		case 'darwin':
			return macos();
		case 'win32':
			return win();
		default:
			return linux();
	}
}
class GlobalConfig {
	project;
	dir;
	file;
	constructor(project) {
		this.project = project;
		this.dir = getConfigDir(this.project.name);
		this.file = path.join(this.dir, 'config.json');
	}
	_store;
	get store() {
		if (this._store) return this._store;
		this.ensureDir();
		if (fs.existsSync(this.file)) {
			try {
				this._store = JSON.parse(fs.readFileSync(this.file).toString());
			} catch {}
		}
		if (!this._store) {
			this._store = {};
			this.write();
		}
		return this._store;
	}
	set store(value) {
		this._store = value;
		this.write();
	}
	ensureDir() {
		fs.mkdirSync(this.dir, { recursive: true });
	}
	write() {
		fs.writeFileSync(this.file, JSON.stringify(this.store, null, '	'));
	}
	clear() {
		this.store = {};
		fs.rmSync(this.file, { recursive: true });
	}
	delete(key) {
		dset(this.store, key, void 0);
		this.write();
		return true;
	}
	get(key) {
		return key.split('.').reduce((obj, k) => obj?.[k], this.store);
	}
	has(key) {
		return typeof this.get(key) !== 'undefined';
	}
	set(key, value) {
		dset(this.store, key, value);
		this.write();
	}
}
export { GlobalConfig };
