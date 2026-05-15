import { transform } from './transform/index.js';
export default function html(): {
	name: string;
	options(options: any): void;
	transform: {
		filter: {
			id: RegExp;
		};
		handler: typeof transform;
	};
};
