"use strict";
// @ts-nocheck
exports.__esModule = true;
var now = typeof process !== 'undefined' && process.hrtime
    ? function () {
        var t = process.hrtime();
        return t[0] * 1e3 + t[1] / 1e6;
    }
    : function () { return self.performance.now(); };
/** Format benchmarks */
function collapse_timings(timings) {
    var result = {};
    timings.forEach(function (timing) {
        result[timing.label] = Object.assign({
            total: timing.end - timing.start
        }, timing.children && collapse_timings(timing.children));
    });
    return result;
}
var Stats = /** @class */ (function () {
    function Stats() {
        this.start_time = now();
        this.stack = [];
        this.current_children = this.timings = [];
    }
    Stats.prototype.start = function (label) {
        var timing = {
            label: label,
            start: now(),
            end: null,
            children: []
        };
        this.current_children.push(timing);
        this.stack.push(timing);
        this.current_timing = timing;
        this.current_children = timing.children;
    };
    Stats.prototype.stop = function (label) {
        if (label !== this.current_timing.label) {
            throw new Error("Mismatched timing labels (expected " + this.current_timing.label + ", got " + label + ")");
        }
        this.current_timing.end = now();
        this.stack.pop();
        this.current_timing = this.stack[this.stack.length - 1];
        this.current_children = this.current_timing ? this.current_timing.children : this.timings;
    };
    Stats.prototype.render = function () {
        var timings = Object.assign({
            total: now() - this.start_time
        }, collapse_timings(this.timings));
        return {
            timings: timings
        };
    };
    return Stats;
}());
exports["default"] = Stats;
