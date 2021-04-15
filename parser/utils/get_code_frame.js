"use strict";
exports.__esModule = true;
/** Die you stupid tabs */
function tabs_to_spaces(str) {
    return str.replace(/^\t+/, function (match) { return match.split('\t').join('  '); });
}
/** Display syntax error in pretty format in logs */
function get_code_frame(source, line, column) {
    var lines = source.split('\n');
    var frame_start = Math.max(0, line - 2);
    var frame_end = Math.min(line + 3, lines.length);
    var digits = String(frame_end + 1).length;
    return lines
        .slice(frame_start, frame_end)
        .map(function (str, i) {
        var isErrorLine = frame_start + i === line;
        var line_num = String(i + frame_start + 1).padStart(digits, ' ');
        if (isErrorLine) {
            var indicator = ' '.repeat(digits + 2 + tabs_to_spaces(str.slice(0, column)).length) + '^';
            return line_num + ": " + tabs_to_spaces(str) + "\n" + indicator;
        }
        return line_num + ": " + tabs_to_spaces(str);
    })
        .join('\n');
}
exports["default"] = get_code_frame;
