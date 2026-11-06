// biome-ignore-all lint/suspicious/noConsole: benchmark CLI output
import { execFile } from 'node:child_process';
import { createHash } from 'node:crypto';
import fs from 'node:fs/promises';
import os from 'node:os';
import { fileURLToPath } from 'node:url';
import { parseArgs, promisify } from 'node:util';
import { FastResizeFilter, ResizeFit, Transformer } from '@napi-rs/image';
import sharp from 'sharp';

const exec = promisify(execFile);
const { values: args } = parseArgs({
	options: {
		runs: { type: 'string', default: '5' },
		workloads: { type: 'string', default: 'webp,avif,jpeg,png' },
		micro: { type: 'boolean', default: false },
	},
});
const RUNS = Number(args.runs);

const repo = new URL('../../../', import.meta.url);
const work = new URL('./.work/', import.meta.url);
const astroBin = fileURLToPath(new URL('../node_modules/astro/bin/astro.mjs', import.meta.url));
const napiEntrypoint = fileURLToPath(new URL('../dist/service.js', import.meta.url));

const PHOTOS = [
	'examples/ssr/public/images/products/cereal.jpg',
	'packages/integrations/vercel/test/fixtures/image/src/assets/penguin.jpg',
	'packages/astro/test/fixtures/astro-assets/src/images/penguin2.jpg',
	...Array.from(
		{ length: 20 },
		(_, i) => `examples/starlog/src/assets/starlog-placeholder-${i + 1}.jpg`,
	),
];
const ALPHA_PNGS = [
	'examples/with-nanostores/public/images/astronaut-figurine.png',
	'packages/integrations/node/test/fixtures/image/src/assets/some_penguin.png',
];

const workloads = {
	webp: { corpus: 'photo', sources: 48, widths: [400, 800, 1200], format: 'webp' },
	avif: { corpus: 'photo', sources: 16, widths: [800], format: 'avif' },
	jpeg: { corpus: 'photo', sources: 48, widths: [800], format: 'jpeg' },
	png: { corpus: 'alpha', sources: 48, widths: [400], format: 'png' },
};

async function uniqueFiles(paths) {
	const seen = new Map();
	for (const path of paths) {
		const data = await fs.readFile(new URL(path, repo)).catch(() => undefined);
		if (!data) continue;
		const hash = createHash('sha256').update(data).digest('hex');
		if (!seen.has(hash)) seen.set(hash, data);
	}
	return [...seen.values()];
}

async function makeSources(corpus, count) {
	const bases = await uniqueFiles(corpus === 'photo' ? PHOTOS : ALPHA_PNGS);
	return Promise.all(
		Array.from({ length: count }, async (_, i) => {
			const base = bases[i % bases.length];
			const round = Math.floor(i / bases.length);
			const { width, height } = await sharp(base).metadata();
			let image = sharp(base).extract({
				left: round * 3,
				top: round * 2,
				width: width - round * 3,
				height: height - round * 2,
			});
			if (round % 2) image = image.flop();
			return corpus === 'photo' ? image.jpeg({ quality: 92 }).toBuffer() : image.png().toBuffer();
		}),
	);
}

async function makeProject(name, workload, service) {
	const root = new URL(`${name}-${service}/`, work);
	const ext = workload.corpus === 'photo' ? 'jpg' : 'png';
	await fs.rm(root, { recursive: true, force: true });
	await fs.mkdir(new URL('src/pages/', root), { recursive: true });
	await fs.mkdir(new URL('src/assets/', root), { recursive: true });
	const sources = await makeSources(workload.corpus, workload.sources);
	await Promise.all(
		sources.map((data, i) =>
			fs.writeFile(new URL(`src/assets/img-${String(i).padStart(3, '0')}.${ext}`, root), data),
		),
	);
	const serviceConfig =
		service === 'napi'
			? `{ entrypoint: ${JSON.stringify(napiEntrypoint)}, config: {} }`
			: `{ entrypoint: 'astro/assets/services/sharp', config: {} }`;
	await fs.writeFile(
		new URL('astro.config.mjs', root),
		`export default { image: { service: ${serviceConfig} } };\n`,
	);
	await fs.writeFile(
		new URL('src/pages/index.astro', root),
		`---
import { Image } from 'astro:assets';
const images = Object.values(import.meta.glob('../assets/*.${ext}', { eager: true, import: 'default' }));
const widths = ${JSON.stringify(workload.widths)};
---
<html><body>
{images.map((src, i) => widths.map((width) => <Image src={src} width={width} format="${workload.format}" alt={String(i)} />))}
</body></html>
`,
	);
	await fs.writeFile(
		new URL('package.json', root),
		JSON.stringify({ name: `bench-${name}-${service}`, private: true, type: 'module' }),
	);
	return root;
}

function parseImagePhase(stdout) {
	const plain = stdout.replace(/\x1b\[[0-9;]*m/g, '');
	const after = plain.slice(plain.indexOf('generating optimized images'));
	const match = after.match(/Completed in ([\d.]+)(ms|s)/);
	if (!match) throw new Error(`Could not find image phase timing in output:\n${plain}`);
	return Number(match[1]) * (match[2] === 's' ? 1000 : 1);
}

async function runBuild(root) {
	await fs.rm(new URL('dist/', root), { recursive: true, force: true });
	await fs.rm(new URL('node_modules/.astro/', root), { recursive: true, force: true });
	const { stdout } = await exec(process.execPath, [astroBin, 'build'], {
		cwd: fileURLToPath(root),
		env: { ...process.env, ASTRO_TELEMETRY_DISABLED: '1' },
		maxBuffer: 64 * 1024 * 1024,
	});
	if (/\[WARN\].*(could not optimize|Unable to generate)/i.test(stdout)) {
		throw new Error(`Build warned about images:\n${stdout}`);
	}
	return parseImagePhase(stdout);
}

async function opaqueRgb(image) {
	const { data, info } = await image.flatten({ background: '#fff' }).removeAlpha().raw().toBuffer({
		resolveWithObject: true,
	});
	return { data, width: info.width, height: info.height };
}

function psnr(a, b) {
	let sum = 0;
	for (let i = 0; i < a.length; i++) sum += (a[i] - b[i]) ** 2;
	const mse = sum / a.length;
	return mse === 0 ? Number.POSITIVE_INFINITY : 10 * Math.log10(255 ** 2 / mse);
}

function ssim(a, b, width, height) {
	const luma = (d) => {
		const out = new Float64Array(width * height);
		for (let i = 0; i < out.length; i++) {
			out[i] = 0.299 * d[i * 3] + 0.587 * d[i * 3 + 1] + 0.114 * d[i * 3 + 2];
		}
		return out;
	};
	const x = luma(a);
	const y = luma(b);
	const c1 = (0.01 * 255) ** 2;
	const c2 = (0.03 * 255) ** 2;
	let total = 0;
	let windows = 0;
	for (let top = 0; top + 8 <= height; top += 4) {
		for (let left = 0; left + 8 <= width; left += 4) {
			let mx = 0,
				my = 0,
				vx = 0,
				vy = 0,
				cov = 0;
			for (let r = 0; r < 8; r++) {
				for (let c = 0; c < 8; c++) {
					const i = (top + r) * width + left + c;
					mx += x[i];
					my += y[i];
				}
			}
			mx /= 64;
			my /= 64;
			for (let r = 0; r < 8; r++) {
				for (let c = 0; c < 8; c++) {
					const i = (top + r) * width + left + c;
					vx += (x[i] - mx) ** 2;
					vy += (y[i] - my) ** 2;
					cov += (x[i] - mx) * (y[i] - my);
				}
			}
			vx /= 63;
			vy /= 63;
			cov /= 63;
			total += ((2 * mx * my + c1) * (2 * cov + c2)) / ((mx ** 2 + my ** 2 + c1) * (vx + vy + c2));
			windows++;
		}
	}
	return total / windows;
}

async function measureOutputs(root) {
	const dir = new URL('dist/_astro/', root);
	const assets = new URL('src/assets/', root);
	const sourceFiles = await fs.readdir(assets);
	const outputs = (await fs.readdir(dir)).filter((file) => /\.(webp|avif|jpe?g|png)$/.test(file));
	let bytes = 0;
	let psnrSum = 0;
	let ssimSum = 0;
	for (const file of outputs) {
		const data = await fs.readFile(new URL(file, dir));
		bytes += data.length;
		const source = sourceFiles.find((name) => name.split('.')[0] === file.split('.')[0]);
		const output = await opaqueRgb(sharp(data));
		const reference = await opaqueRgb(
			sharp(new URL(source, assets).pathname)
				.rotate()
				.resize(output.width, output.height, { fit: 'fill', kernel: 'lanczos3' }),
		);
		psnrSum += psnr(output.data, reference.data);
		ssimSum += ssim(output.data, reference.data, output.width, output.height);
	}
	return {
		files: outputs.length,
		bytes,
		psnr: psnrSum / outputs.length,
		ssim: ssimSum / outputs.length,
	};
}

const fmt = (ms) => `${(ms / 1000).toFixed(2)}s`;
const median = (xs) => {
	const s = [...xs].sort((a, b) => a - b);
	return s.length % 2 ? s[(s.length - 1) / 2] : (s[s.length / 2 - 1] + s[s.length / 2]) / 2;
};
const mean = (xs) => xs.reduce((a, b) => a + b, 0) / xs.length;
const stdev = (xs) => Math.sqrt(mean(xs.map((x) => (x - mean(xs)) ** 2)));

async function benchBuilds() {
	for (const name of args.workloads.split(',')) {
		const workload = workloads[name];
		const transforms = workload.sources * workload.widths.length;
		console.log(
			`\n## ${name}: ${workload.sources} ${workload.corpus === 'photo' ? 'photos' : 'alpha PNGs'} x widths ${workload.widths.join('/')} = ${transforms} transforms -> ${workload.format}`,
		);
		const roots = {
			sharp: await makeProject(name, workload, 'sharp'),
			napi: await makeProject(name, workload, 'napi'),
		};
		// Untimed, so the first timed build doesn't pay for cold caches and native module loading.
		await runBuild(roots.sharp);
		await runBuild(roots.napi);
		const times = { sharp: [], napi: [] };
		for (let i = 0; i < RUNS; i++) {
			for (const service of i % 2 ? ['napi', 'sharp'] : ['sharp', 'napi']) {
				times[service].push(await runBuild(roots[service]));
			}
		}
		for (const service of ['sharp', 'napi']) {
			const t = times[service];
			const q = await measureOutputs(roots[service]);
			console.log(
				`  ${service.padEnd(5)} image phase median ${fmt(median(t))} mean ${fmt(mean(t))} ±${fmt(stdev(t))} [${t.map(fmt).join(' ')}] | ${q.files} files ${(q.bytes / 1024).toFixed(0)} KiB, PSNR ${q.psnr.toFixed(2)} dB, SSIM ${q.ssim.toFixed(4)}`,
			);
		}
		const ratio = median(times.sharp) / median(times.napi);
		console.log(
			`  napi vs sharp (image phase, median): ${ratio.toFixed(2)}x ${ratio >= 1 ? 'faster' : 'slower'}`,
		);
	}
}

async function benchMicro() {
	// Read up front so the napi timing doesn't include a Sharp metadata call.
	const sources = await Promise.all(
		(await makeSources('photo', 48)).map(async (input) => ({
			input,
			...(await sharp(input).metadata()),
		})),
	);
	const sharpQuality = { webp: 80, avif: 50, jpeg: 80 };
	const lib = {
		sharp: ({ input }, width, format) =>
			sharp(input)
				.rotate()
				.resize({ width, withoutEnlargement: true })
				[format]({ quality: sharpQuality[format] })
				.toBuffer(),
		napi: ({ input, width: w, height: h }, width, format) => {
			const t = new Transformer(input).rotate().fastResize({
				width,
				height: Math.round((h * width) / w),
				fit: ResizeFit.Fill,
				filter: FastResizeFilter.Lanczos3,
			});
			return format === 'avif' ? t.avif({ quality: 50 }) : t[format](sharpQuality[format]);
		},
	};
	async function pool(items, concurrency, fn) {
		let next = 0;
		await Promise.all(
			Array.from({ length: concurrency }, async () => {
				while (next < items.length) await fn(items[next++]);
			}),
		);
	}
	console.log('\n## micro: 48 photos -> width 800, library calls only (median of 3)');
	for (const format of ['webp', 'jpeg', 'avif']) {
		const items = format === 'avif' ? sources.slice(0, 16) : sources;
		for (const concurrency of [1, 4, os.availableParallelism()]) {
			const row = [];
			for (const name of ['sharp', 'napi']) {
				const times = [];
				for (let i = 0; i < 3; i++) {
					const start = performance.now();
					await pool(items, concurrency, (source) => lib[name](source, 800, format));
					times.push(performance.now() - start);
				}
				row.push(`${name} ${fmt(median(times))}`);
			}
			console.log(
				`  ${format} x${items.length} concurrency ${String(concurrency).padStart(2)}: ${row.join('  ')}`,
			);
		}
	}
}

console.log(
	`node ${process.version}, ${os.cpus()[0].model}, ${os.availableParallelism()} cores, ${Math.round(os.totalmem() / 2 ** 30)} GiB, ` +
		`sharp ${sharp.versions.sharp} (libvips ${sharp.versions.vips}), @napi-rs/image ${JSON.parse(await fs.readFile(new URL('../node_modules/@napi-rs/image/package.json', import.meta.url))).version}, ` +
		`UV_THREADPOOL_SIZE=${process.env.UV_THREADPOOL_SIZE ?? 'default (4)'}, runs=${RUNS}`,
);
if (args.micro) await benchMicro();
else await benchBuilds();
