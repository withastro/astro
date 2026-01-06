import { DevEnvironment } from 'vite';

class NonRunnableEnvironment extends DevEnvironment {
	constructor(name, config) {
		super(name, config, {
			hot: true,
		});
	}
}

export function nonRunnableEnvironment() {
	return {
		name: 'non-runnable-environment',
		config() {
			return {
				environments: {
					'non-runnable-environment': {
						dev: {
							createEnvironment(name, config) {
								return new NonRunnableEnvironment(name, config);
							},
						},
					},
				},
			};
		},
	};
}
