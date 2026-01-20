<!-- 
INSTRUCTIONS FOR LLM:
This template should be used to generate a final report after investigating and attempting to fix a bug.

BEFORE GENERATING THE REPORT:

1. Generate patches (if a fix was developed):
   - Create a patch for `node_modules/` changes (for users to apply via patch-package)
   - If the source repo is available, apply the fix there and generate a git diff (for maintainers). The source repo contains the source code, which is different from the compiled JavaScript you just encountered in the node_modules/ directory (ex: it is TypeScript, not JavaScript) but the overall file contents and folder structure should be the same.

2. Adapt the template to fit your findings:
   - Include only the sections that are relevant to what you discovered
   - If you could NOT reproduce the issue, omit the fix-related sections
   - If no fix was developed, omit the patching sections
   - Add or remove subsections as needed to clearly communicate findings

3. Keep it concise:
   - Summary section: One sentence per bold field
   - Use collapsible <details> sections for longer content
   - Include exact versions, commands, and file paths where relevant

4. Format requirements:
   - Code blocks: Use appropriate language hints (bash, typescript, diff, patch, etc.)
   - Patches: Use ```patch for user patches and ```diff for maintainer patches

-->

## Summary

**[I was able to reproduce this issue.]** [1-2 sentences describing the reproduction result and key observations.]

**Cause:** [Single sentence explaining the root cause - or just the word "Unknown" if reproduction not determined.]

**Impact:** [Single sentence describing who is affected and how - or just the word "Unknown" if reproduction not determined.]

**Fix:** [Single sentence summarizing the solution - or just the word "Unknown" if no fix determined.]

---

<details>
<summary><strong>Reproduction Details</strong></summary>

### Environment
<!-- List relevant packages and versions -->
- **[Package Name]:** [version]
- **Node.js:** [version]
- **Package Manager:** [npm/pnpm/yarn]

### Steps to Reproduce
<!-- Numbered list of steps. Include code blocks where helpful. -->

1. [First step]
2. [Next step]
   <!-- Continue as needed -->

### Expected Result
[What should happen]

### Actual Result
[What actually happens, including error messages if applicable]

</details>

<!-- 
CONDITIONAL SECTION: Include only if a fix for the main astro repo was developed.  Otherwise, replace the section content with a note that says that a maintainer patch is not available, and explain why in just a few sentences, maximum. 
-->
<details>
<summary><strong>How to Fix (Maintainers)</strong></summary>

### Root Cause Analysis
<!-- Explain why the bug occurs. Structure this however makes sense for the issue. -->

[Explanation of the root cause, which files are involved, and why the current behavior is incorrect.]

### Solution
<!-- Explain the fix approach -->

[Description of the fix and why it works.]

### Git Patch

Apply this patch to the `[org/repo]` repository:

```diff
[INSERT GIT DIFF]
```

<!-- Optional: Include if there are meaningful alternatives worth mentioning -->
### Alternative Approaches
[Other approaches considered and their tradeoffs]

### Testing
<!-- Suggest how to verify the fix works -->
[How to test that the fix is working correctly]

</details>


<!-- 
CONDITIONAL SECTION: Include only if a fix was developed and can be applied via patch-package. Otherwise, replace the section content with a note that says that a user patch is not available, and explain why in just a few sentences, maximum.
-->
<details>
<summary><strong>How to Patch (Users)</strong></summary>

You can use [`patch-package`](https://www.npmjs.com/package/patch-package) to apply this fix in your project before an official release.

### Steps

1. Install patch-package:
   ```bash
   npm install patch-package --save-dev
   ```

2. Add a postinstall script to `package.json`:
   ```json
   {
     "scripts": {
       "postinstall": "patch-package"
     }
   }
   ```

3. Create the patch file at `patches/[package-name]+[version].patch`:

```patch
[INSERT PATCH CONTENT]
```

4. Run `npm install` to apply the patch.

<!-- Optional: Include if there are caveats or behavioral changes -->
### Caveats
[Any important notes about the patch behavior]

</details>


*This report was made by an LLM. Mistakes happen, check important info.*
