import path from 'node:path';

export const runtimeDir = path.resolve(
	process.env.RUNTIME_DIR ?? '',
	`${process.env.A}-${process.env.B}`,
);
