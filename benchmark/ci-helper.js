const benchLogs = process.argv[2];
const resultRegex = /==========(.*?)==========/gs;

let processedLog = '';
let m;
while ((m = resultRegex.exec(benchLogs))) {
	processedLog += m[1] + '\n';
}

console.log(processedLog);
