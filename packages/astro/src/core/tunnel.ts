import type { TunnelOptions } from 'untun';
import { startTunnel } from 'untun';

export async function createTunnel(options: TunnelOptions) {
	const tunnelInstance = await startTunnel(options);

	const tunnelUrl = await tunnelInstance?.getURL();

	return { tunnelInstance, tunnelUrl };
}

export type TCreateTunnel = Awaited<ReturnType<typeof createTunnel>>;
