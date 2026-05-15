import { type Flags } from '../flags.js';
interface DevOptions {
	flags: Flags;
}
export declare function dev({
	flags,
}: DevOptions): Promise<import('../../core/dev/dev.js').DevServer | undefined>;
export {};
