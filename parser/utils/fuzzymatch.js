"use strict";
// @ts-nocheck
exports.__esModule = true;
/** Utility for accessing FuzzySet */
function fuzzymatch(name, names) {
    var set = new FuzzySet(names);
    var matches = set.get(name);
    return matches && matches[0] && matches[0][0] > 0.7 ? matches[0][1] : null;
}
exports["default"] = fuzzymatch;
// adapted from https://github.com/Glench/fuzzyset.js/blob/master/lib/fuzzyset.js
// BSD Licensed
var GRAM_SIZE_LOWER = 2;
var GRAM_SIZE_UPPER = 3;
/** Return an edit distance from 0 to 1 */
function _distance(str1, str2) {
    if (str1 === null && str2 === null) {
        throw 'Trying to compare two null values';
    }
    if (str1 === null || str2 === null)
        return 0;
    str1 = String(str1);
    str2 = String(str2);
    var distance = levenshtein(str1, str2);
    if (str1.length > str2.length) {
        return 1 - distance / str1.length;
    }
    else {
        return 1 - distance / str2.length;
    }
}
/** @url https://github.com/Glench/fuzzyset.js/blob/master/lib/fuzzyset.js#L18 */
function levenshtein(str1, str2) {
    var current = [];
    var prev;
    var value;
    for (var i = 0; i <= str2.length; i++) {
        for (var j = 0; j <= str1.length; j++) {
            if (i && j) {
                if (str1.charAt(j - 1) === str2.charAt(i - 1)) {
                    value = prev;
                }
                else {
                    value = Math.min(current[j], current[j - 1], prev) + 1;
                }
            }
            else {
                value = i + j;
            }
            prev = current[j];
            current[j] = value;
        }
    }
    return current.pop();
}
var non_word_regex = /[^\w, ]+/;
/** @url https://github.com/Glench/fuzzyset.js/blob/master/lib/fuzzyset.js#L53 */
function iterate_grams(value, gram_size) {
    if (gram_size === void 0) { gram_size = 2; }
    var simplified = '-' + value.toLowerCase().replace(non_word_regex, '') + '-';
    var len_diff = gram_size - simplified.length;
    var results = [];
    if (len_diff > 0) {
        for (var i = 0; i < len_diff; ++i) {
            value += '-';
        }
    }
    for (var i = 0; i < simplified.length - gram_size + 1; ++i) {
        results.push(simplified.slice(i, i + gram_size));
    }
    return results;
}
/** @url https://github.com/Glench/fuzzyset.js/blob/master/lib/fuzzyset.js#L69 */
function gram_counter(value, gram_size) {
    if (gram_size === void 0) { gram_size = 2; }
    // return an object where key=gram, value=number of occurrences
    var result = {};
    var grams = iterate_grams(value, gram_size);
    var i = 0;
    for (i; i < grams.length; ++i) {
        if (grams[i] in result) {
            result[grams[i]] += 1;
        }
        else {
            result[grams[i]] = 1;
        }
    }
    return result;
}
/** @url https://github.com/Glench/fuzzyset.js/blob/master/lib/fuzzyset.js#L158 */
function sort_descending(a, b) {
    return b[0] - a[0];
}
var FuzzySet = /** @class */ (function () {
    function FuzzySet(arr) {
        this.exact_set = {};
        this.match_dict = {};
        this.items = {};
        // initialization
        for (var i = GRAM_SIZE_LOWER; i < GRAM_SIZE_UPPER + 1; ++i) {
            this.items[i] = [];
        }
        // add all the items to the set
        for (var i = 0; i < arr.length; ++i) {
            this.add(arr[i]);
        }
    }
    FuzzySet.prototype.add = function (value) {
        var normalized_value = value.toLowerCase();
        if (normalized_value in this.exact_set) {
            return false;
        }
        var i = GRAM_SIZE_LOWER;
        for (i; i < GRAM_SIZE_UPPER + 1; ++i) {
            this._add(value, i);
        }
    };
    FuzzySet.prototype._add = function (value, gram_size) {
        var normalized_value = value.toLowerCase();
        var items = this.items[gram_size] || [];
        var index = items.length;
        items.push(0);
        var gram_counts = gram_counter(normalized_value, gram_size);
        var sum_of_square_gram_counts = 0;
        var gram;
        var gram_count;
        for (gram in gram_counts) {
            gram_count = gram_counts[gram];
            sum_of_square_gram_counts += Math.pow(gram_count, 2);
            if (gram in this.match_dict) {
                this.match_dict[gram].push([index, gram_count]);
            }
            else {
                this.match_dict[gram] = [[index, gram_count]];
            }
        }
        var vector_normal = Math.sqrt(sum_of_square_gram_counts);
        items[index] = [vector_normal, normalized_value];
        this.items[gram_size] = items;
        this.exact_set[normalized_value] = value;
    };
    FuzzySet.prototype.get = function (value) {
        var normalized_value = value.toLowerCase();
        var result = this.exact_set[normalized_value];
        if (result) {
            return [[1, result]];
        }
        var results = [];
        // start with high gram size and if there are no results, go to lower gram sizes
        for (var gram_size = GRAM_SIZE_UPPER; gram_size >= GRAM_SIZE_LOWER; --gram_size) {
            results = this.__get(value, gram_size);
            if (results) {
                return results;
            }
        }
        return null;
    };
    FuzzySet.prototype.__get = function (value, gram_size) {
        var normalized_value = value.toLowerCase();
        var matches = {};
        var gram_counts = gram_counter(normalized_value, gram_size);
        var items = this.items[gram_size];
        var sum_of_square_gram_counts = 0;
        var gram;
        var gram_count;
        var i;
        var index;
        var other_gram_count;
        for (gram in gram_counts) {
            gram_count = gram_counts[gram];
            sum_of_square_gram_counts += Math.pow(gram_count, 2);
            if (gram in this.match_dict) {
                for (i = 0; i < this.match_dict[gram].length; ++i) {
                    index = this.match_dict[gram][i][0];
                    other_gram_count = this.match_dict[gram][i][1];
                    if (index in matches) {
                        matches[index] += gram_count * other_gram_count;
                    }
                    else {
                        matches[index] = gram_count * other_gram_count;
                    }
                }
            }
        }
        var vector_normal = Math.sqrt(sum_of_square_gram_counts);
        var results = [];
        var match_score;
        // build a results list of [score, str]
        for (var match_index in matches) {
            match_score = matches[match_index];
            results.push([match_score / (vector_normal * items[match_index][0]), items[match_index][1]]);
        }
        results.sort(sort_descending);
        var new_results = [];
        var end_index = Math.min(50, results.length);
        // truncate somewhat arbitrarily to 50
        for (var j = 0; j < end_index; ++j) {
            new_results.push([_distance(results[j][1], normalized_value), results[j][1]]);
        }
        results = new_results;
        results.sort(sort_descending);
        new_results = [];
        for (var j = 0; j < results.length; ++j) {
            if (results[j][0] == results[0][0]) {
                new_results.push([results[j][0], this.exact_set[results[j][1]]]);
            }
        }
        return new_results;
    };
    return FuzzySet;
}());
