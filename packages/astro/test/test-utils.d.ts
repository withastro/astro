export interface TestDevServer {
	stop(): Promise<void>;
}

export interface TestFixture {
	startDevServer(extraInlineConfig?: Record<string, unknown>): Promise<TestDevServer | undefined>;
	fetch(url: string, init?: RequestInit): Promise<Response>;
}

export function loadFixture(
	inlineConfig: Record<string, unknown> & { root: string | URL },
): Promise<TestFixture>;
