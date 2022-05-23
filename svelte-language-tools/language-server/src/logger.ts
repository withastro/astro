export class Logger {
    private static logErrorsOnly = false;
    static setLogErrorsOnly(logErrorsOnly: boolean) {
        Logger.logErrorsOnly = logErrorsOnly;
    }

    static log(...args: any) {
        if (!Logger.logErrorsOnly) {
            console.log(...args);
        }
    }

    static error(...args: any) {
        console.error(...args);
    }
}
