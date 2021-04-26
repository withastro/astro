const snowpackManifest = JSON.parse(fs.readFileSync(path.join(__dirname, '../../snowpack/package.json'), 'utf8'));
export default snowpackManifest.version;
