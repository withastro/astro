/**
 * Astro Telemetry -- System Info
 *
 * To better understand our telemetry insights, Astro collects the following anonymous information
 * about the system that it runs on. This helps us prioritize fixes and new features based on a
 * better understanding of our real-world system requirements.
 *
 * ~~~
 *
 * Q: Can this system info be traced back to me?
 *
 * A: No personally identifiable information is contained in the system info that we collect. It could
 * be possible for someone with direct access to your machine to collect this information themselves
 * and then attempt to match it all together with our collected telemetry data, however most users'
 * systems are probably not uniquely identifiable via their system info alone.
 *
 * ~~~
 *
 * Q: I don't want Astro to collect system info. How can I disable it?
 *
 * A: You can disable telemetry completely at any time by running `astro telemetry disable`. There is
 * currently no way to disable this otherwise while keeping the rest of telemetry enabled.
 */
export type SystemInfo = {
	systemPlatform: NodeJS.Platform;
	systemRelease: string;
	systemArchitecture: string;
	astroVersion: string;
	nodeVersion: string;
	viteVersion: string;
	cpuCount: number;
	cpuModel: string | null;
	cpuSpeed: number | null;
	memoryInMb: number;
	isDocker: boolean;
	isTTY: boolean;
	isWSL: boolean;
	isCI: boolean;
	ciName: string | null;
};
export declare function getSystemInfo(versions: {
	viteVersion: string;
	astroVersion: string;
}): SystemInfo;
