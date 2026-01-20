# Report Phase

This document guides you through generating a final report of your triage findings.

## Prerequisites

- You have completed the triage phase (see [TRIAGE.md](TRIAGE.md))
- If a fix was developed, you have completed the fix phase (see [FIX.md](FIX.md))

## Step 1: Gather Information

Collect all relevant information from your investigation:

**From Triage:**
- Was the issue reproducible?
- What environment/versions were used?
- What exact steps reproduce the issue?
- What error messages were observed?

**From Fix (if applicable):**
- What is the root cause?
- What files were modified?
- What is the solution?
- Do you have both patches (node_modules and source)?

## Step 2: Generate Patches

If you developed a fix, generate both patches:

### User Patch (node_modules)

```bash
# Get original package
npm pack <package>@<version> --pack-destination /tmp
tar -xzf /tmp/<package>-<version>.tgz -C /tmp

# Generate diff
diff -u /tmp/package/dist/<file>.js repro-issue/node_modules/<package>/dist/<file>.js
```

### Maintainer Patch (source)

```bash
# From the astro repo root
git diff packages/
```

## Step 3: Write the Report

Create a file named `report.md` in the current working directory.

Use the template at [references/report-template.md](references/report-template.md) as your guide. The template includes:

- **Summary section**: One sentence each for reproduction status, cause, impact, and fix
- **Reproduction Details**: Collapsible section with environment, steps, and results
- **How to Fix (Maintainers)**: Collapsible section with root cause analysis and git patch
- **How to Patch (Users)**: Collapsible section with patch-package instructions

## Step 4: Adapt the Template

Follow the instructions in the template comments:

1. **Include only relevant sections**: 
   - If not reproducible, omit fix-related content
   - If no fix developed, note why in each section

2. **Keep it concise**:
   - Summary fields are single sentences
   - Use collapsible sections for details

3. **Be specific**:
   - Include exact package versions
   - Include exact commands used
   - Include complete error messages

## Step 5: Review the Report

Before finalizing, verify:

- [ ] Summary accurately reflects findings
- [ ] Reproduction steps are complete and correct
- [ ] Patches are properly formatted (```patch and ```diff)
- [ ] All placeholders have been replaced
- [ ] Collapsible sections work correctly

## Output

The final report should be written to `report.md` in the current working directory.

After writing the report, inform the user that the report is ready and provide a brief summary of findings.
