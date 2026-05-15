import os from 'node:os';
import { name as ciName, isCI } from 'ci-info';
import isDocker from 'is-docker';
import isWSL from 'is-wsl';
let meta;
function getSystemInfo(versions) {
	if (meta) {
		return meta;
	}
	const cpus = os.cpus() || [];
	return {
		// Version information
		nodeVersion: process.version.replace(/^v?/, ''),
		viteVersion: versions.viteVersion,
		astroVersion: versions.astroVersion,
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
		isTTY: process.stdout.isTTY,
		isWSL,
		isCI,
		ciName,
	};
}
export { getSystemInfo };
