import { detectAgenticEnvironment } from 'am-i-vibing';

export function isRunByAgent(): boolean {
	try {
		// Only treat direct "agent" types as auto-background-worthy.
		// "hybrid" environments (e.g. Warp terminal) may not actually be running
		// an AI agent, so we avoid false positives by excluding them.
		return detectAgenticEnvironment().type === 'agent';
	} catch {
		return false;
	}
}
