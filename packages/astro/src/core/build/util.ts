export function getTimeStat(timeStart: number, timeEnd: number) {
	const buildTime = timeEnd - timeStart;
	return buildTime < 1000 ? `${Math.round(buildTime)}ms` : `${(buildTime / 1000).toFixed(2)}s`;
}
