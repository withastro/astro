// Child process helper for the "multiple standalone entries in one process"
// tests in aborted-request.test.ts. Imports the same built entry twice as
// distinct module instances (each instance evaluates its own bundled copy of
// @astrojs/node) and starts both standalone servers on the ports given in
// PORT_A and PORT_B. The process stays alive until the test kills it.
process.env.ASTRO_NODE_AUTOSTART = 'disabled';

const entryUrl = process.env.ENTRY_URL;
if (!entryUrl) throw new Error('ENTRY_URL is required');

const entryA = await import(`${entryUrl}?id=a`);
const entryB = await import(`${entryUrl}?id=b`);

process.env.PORT = process.env.PORT_A;
entryA.startServer();
process.env.PORT = process.env.PORT_B;
entryB.startServer();

setInterval(() => {}, 1000);
