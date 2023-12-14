import { startTunnel } from 'untun';

export async function createTunnel({ port }: { port: number }) {
	const tunnelInstance = await startTunnel({
		port,
	});

	const tunnelUrl = await tunnelInstance?.getURL();

	return { tunnelInstance, tunnelUrl };
}

export type TCreateTunnel = Awaited<ReturnType<typeof createTunnel>>;
