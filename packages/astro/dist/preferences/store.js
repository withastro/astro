import fs from 'node:fs';
import path from 'node:path';
import { dset } from 'dset';
import { SETTINGS_FILE } from './constants.js';
import dget from './dlv.js';
class PreferenceStore {
	dir;
	file;
	constructor(dir, filename = SETTINGS_FILE) {
		this.dir = dir;
		this.file = path.join(this.dir, filename);
	}
	_store;
	get store() {
		if (this._store) return this._store;
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
	write() {
		if (!this._store || Object.keys(this._store).length === 0) return;
		fs.mkdirSync(this.dir, { recursive: true });
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
		return dget(this.store, key);
	}
	has(key) {
		return typeof this.get(key) !== 'undefined';
	}
	set(key, value) {
		if (this.get(key) === value) return;
		dset(this.store, key, value);
		this.write();
	}
	getAll() {
		return this.store;
	}
}
export { PreferenceStore };
