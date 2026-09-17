import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { once } from 'node:events';

export function startProtocolProcess(t, args, cwd, protocol) {
	const env = { ...process.env };
	delete env.NODE_OPTIONS;
	delete env.NODE_PATH;
	const child = spawn(process.env.LANGUAGE_TOOLS_NODE ?? process.execPath, args, {
		cwd,
		env,
		stdio: ['pipe', 'pipe', 'pipe'],
	});
	let stderr = '';
	child.stderr.on('data', (chunk) => {
		stderr += chunk;
	});
	const pending = new Map();
	let buffer = Buffer.alloc(0);
	let seq = 0;
	const rejectPending = (error) => {
		for (const request of pending.values()) request.reject(error);
		pending.clear();
	};
	child.on('error', rejectPending);
	child.on('exit', (code, signal) =>
		rejectPending(new Error(`Child exited (${code}, ${signal}): ${stderr}`)),
	);
	child.stdout.on('data', (chunk) => {
		buffer = Buffer.concat([buffer, chunk]);
		try {
			for (;;) {
				const headerEnd = buffer.indexOf('\r\n\r\n');
				if (headerEnd < 0) return;
				const header = buffer.subarray(0, headerEnd).toString();
				const length = /Content-Length: (\d+)/i.exec(header);
				assert.ok(length, `Invalid protocol header: ${header}`);
				const start = headerEnd + 4;
				const end = start + Number(length[1]);
				if (buffer.length < end) return;
				const message = JSON.parse(buffer.subarray(start, end).toString());
				buffer = buffer.subarray(end);
				const id = protocol === 'tsserver' ? message.request_seq : message.id;
				const request = pending.get(id);
				if (request) {
					pending.delete(id);
					if (message.error || message.success === false)
						request.reject(new Error(JSON.stringify(message)));
					else request.resolve(protocol === 'tsserver' ? message.body : message.result);
				}
			}
		} catch (error) {
			rejectPending(error);
		}
	});
	t.after(async () => {
		rejectPending(new Error('Test finished'));
		if (child.exitCode === null && child.signalCode === null) {
			const exited = once(child, 'exit');
			child.kill();
			const timer = setTimeout(() => child.kill('SIGKILL'), 2000);
			try {
				await exited;
			} finally {
				clearTimeout(timer);
			}
		}
	});
	function send(message) {
		const json = JSON.stringify(message);
		child.stdin.write(
			protocol === 'tsserver'
				? `${json}\n`
				: `Content-Length: ${Buffer.byteLength(json)}\r\n\r\n${json}`,
		);
	}
	return {
		notify(method, params) {
			send({ jsonrpc: '2.0', method, params });
		},
		request(command, args) {
			const id = ++seq;
			return new Promise((resolve, reject) => {
				const timer = setTimeout(() => {
					pending.delete(id);
					reject(new Error(`Timed out waiting for ${command}: ${stderr}`));
				}, 20000);
				pending.set(id, {
					resolve(value) {
						clearTimeout(timer);
						resolve(value);
					},
					reject(error) {
						clearTimeout(timer);
						reject(error);
					},
				});
				send(
					protocol === 'tsserver'
						? { seq: id, type: 'request', command, arguments: args }
						: { jsonrpc: '2.0', id, method: command, params: args },
				);
			});
		},
	};
}
