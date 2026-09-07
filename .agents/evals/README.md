# Skill evals

Repository skill evals are live-model tests. They are separate from `pnpm test` and are not wired into CI because every case spends provider tokens and can be nondeterministic.

Provider credentials must be exported in the process running Vitest. The default models require `ANTHROPIC_API_KEY`; when overriding the models, export the corresponding provider variables documented in [Flue's provider credentials guide](https://flueframework.com/docs/guide/models/#provider-credentials).

Validate all manifests without calling a model:

```sh
pnpm eval:skills:validate
```

Run one skill or one case by filtering the Vitest test name:

```sh
ANTHROPIC_API_KEY=... pnpm eval:skills -t "changeset"
ANTHROPIC_API_KEY=... pnpm eval:skills -t "changeset #1"
```

Running `pnpm eval:skills` without `-t` executes every case. Each case uses one subject-model run and one judge-model run. The defaults are `anthropic/claude-sonnet-4-6` and `anthropic/claude-haiku-4-5`; override them with `SKILL_EVAL_MODEL` and `SKILL_EVAL_JUDGE_MODEL`. Set `SKILL_EVAL_VERBOSE=1` to print passing outputs and judge summaries.

Every run gets a temporary workspace that is deleted afterward. Files listed in a manifest's `files` array are copied from repository-relative paths into that workspace before the model starts. Eval manifests live beside their skills at `.agents/skills/<name>/evals/evals.json`; the runner excludes those manifests when mounting skill resources so expected results are not exposed to the subject model.
