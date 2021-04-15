interface Timing {
    label: string;
    start: number;
    end: number;
    children: Timing[];
}
export default class Stats {
    start_time: number;
    current_timing: Timing;
    current_children: Timing[];
    timings: Timing[];
    stack: Timing[];
    constructor();
    start(label: any): void;
    stop(label: any): void;
    render(): {
        timings: {
            total: number;
        };
    };
}
export {};
