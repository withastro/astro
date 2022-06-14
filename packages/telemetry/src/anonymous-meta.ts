import { isCI, name as ciName } from 'ci-info';
import isDocker from 'is-docker';
import isWSL from 'is-wsl';
import os from 'node:os';

type AnonymousMeta = {
	systemPlatform: NodeJS.Platform;
	systemRelease: string;
	systemArchitecture: string;
	cpuCount: number;
	cpuModel: string | null;
	cpuSpeed: number | null;
	memoryInMb: number;
	isDocker: boolean;
	isWSL: boolean;
	isCI: boolean;
	ciName: string | null;
	astroVersion: string;
};

let meta: AnonymousMeta | undefined;

export function getAnonymousMeta(astroVersion: string): AnonymousMeta {
	if (meta) {
		return meta;
	}

	const cpus = os.cpus() || [];
	meta = {
		// Software information
		systemPlatform: os.platform(),
		systemRelease: os.release(),
		systemArchitecture: os.arch(),
		// Machine information
		cpuCount: cpus.length,
		cpuModel: cpus.length ? cpus[0].model : null,
		cpuSpeed: cpus.length ? cpus[0].speed : null,
		memoryInMb: Math.trunc(os.totalmem() / Math.pow(1024, 2)),
		// Environment information
		isDocker: isDocker(),
		isWSL,
		isCI,
		ciName,
		astroVersion,
	};

	return meta!;
}
