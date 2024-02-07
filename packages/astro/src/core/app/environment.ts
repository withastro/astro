import { Environment } from "../environment.js";

export class AppEnvironment extends Environment {
    static create({ logger, manifest, mode, renderers, resolve, serverLike, streaming }: Pick<AppEnvironment, 'logger' | 'manifest' | 'mode' | 'renderers' | 'resolve' | 'serverLike' | 'streaming'>) {
        return new AppEnvironment(logger, manifest, mode, renderers, resolve, serverLike, streaming);
    }
}
