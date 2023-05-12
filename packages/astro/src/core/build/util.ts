import type { AstroConfig } from "../../@types/astro";

export function getTimeStat(timeStart: number, timeEnd: number) {
	const buildTime = timeEnd - timeStart;
	return buildTime < 750 ? `${Math.round(buildTime)}ms` : `${(buildTime / 1000).toFixed(2)}s`;
}

// TODO: remove after the experimetal phase when
// it won't be needed to edit two config fields to enable the feature
export function isHybridMalconfigured(config: AstroConfig){
	return config.experimental.hybridOutput
	? config.output !== 'hybrid'
	: config.output === 'hybrid'
}
