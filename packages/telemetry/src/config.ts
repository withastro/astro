import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import process from 'node:process';
import { dset } from 'dset';
import dget from 'dlv';

export interface ConfigOptions {
	name: string;
	defaults: Map<string, any>;
}

// Adapted from https://github.com/sindresorhus/env-paths
function getConfigDir(name: string) {
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

export class Config {
	private dir: string;
	private file: string;

	constructor(private project: ConfigOptions) {
		this.dir = getConfigDir(this.project.name);
		this.file = path.join(this.dir, 'config.json');
	}

	private _store?: Record<string, any>;
	private get store(): Record<string, any> {
		if (this._store) return this._store;
		this.ensureDir();
		if (fs.existsSync(this.file)) {
			this._store = JSON.parse(fs.readFileSync(this.file).toString());
		} else {
			const store = {};
			for (const [key, value] of this.project.defaults) {
				dset(store, key, value);
			}
			this._store = store;
			this.write();
		}
		return this._store!;
	}
	private set store(value: Record<string, any>) {
		this._store = value;
		this.write();
	}
	private ensureDir() {
		fs.mkdirSync(this.dir, { recursive: true });
	}
	write() {
		fs.writeFileSync(this.file, JSON.stringify(this.store, null, '\t'));
	}
	clear(): void {
		this.store = {};
		fs.rmSync(this.file, { recursive: true });
	}
	delete(key: string): boolean {
		dset(this.store, key, undefined);
		this.write();
		return true;
	}
	get(key: string): any {
		return dget(this.store, key);
	}
	has(key: string): boolean {
		return typeof this.get(key) !== 'undefined';
	}
	set(key: string, value: any): void {
		dset(this.store, key, value);
		this.write();
	}
}
