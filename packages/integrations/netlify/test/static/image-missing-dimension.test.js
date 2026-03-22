import { execSync } from 'node:child_process';
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import fs from 'node:fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, 'fixtures', 'image-missing-dimension');

describe('Image validation which is not size specification in netlify.', () => {
  it('throws on missing dimension in static build', () => {
    if (!fs.existsSync(projectRoot)) {
      throw new Error(`Project not found: ${projectRoot}`);
    }

    let error = null;
    let output = '';
    
    try {
      output = execSync(`npx astro build --root "${projectRoot}"`, {
        encoding: 'utf8',
        stdio: 'pipe', 
        shell: true,
        env: { ...process.env, NODE_ENV: 'production' }
      });
    } catch (e) {
			// if an error occurs, capture the output for assertion
      error = e;
      output = (e.stdout || '') + (e.stderr || '');
    }

    // The build should fail if mandatory dimensions are missing
    assert.notEqual(
      error, 
      null, 
      `Build succeeded, but it should have failed due to missing dimensions.`
    );

		// check the error message about missing image dimensions
    assert.match(
      output,
      /MissingImageDimension/,
      `Build failed but not with the expected "MissingImageDimension"`
    );
  });
});
