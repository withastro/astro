import type { AstroLoggerDestination } from '../core.js';

export default function compose(destinations: AstroLoggerDestination[]): AstroLoggerDestination {
	return {
		write(chunk) {
			for (const logger of destinations) {
				logger.write(chunk);
			}
		},
		flush() {
			for (const logger of destinations) {
				if (logger.flush) {
					logger.flush();
				}
			}
		},
		close() {
			for (const logger of destinations) {
				if (logger.close) {
					logger.close();
				}
			}
		},
	};
}
