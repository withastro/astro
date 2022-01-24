import { Plugin } from '../plugin';
import { ResolvedConfig } from '../config';
/**
 * some values used by the client needs to be dynamically injected by the server
 * @server-only
 */
export declare function clientInjectionsPlugin(config: ResolvedConfig): Plugin;
