type Runtime = import('./dist/index.d.ts').Runtime;

declare namespace App {
	interface Locals extends Runtime {}
}
