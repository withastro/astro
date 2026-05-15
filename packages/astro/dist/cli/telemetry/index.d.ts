import { type Flags } from '../flags.js';
interface TelemetryOptions {
	flags: Flags;
}
export declare function notify(): Promise<void>;
export declare function update(subcommand: string, { flags }: TelemetryOptions): Promise<void>;
export {};
