# AGENTS.md

Rules for AI agents in this repository. `CLAUDE.md` symlinks here; edit this
file, never a copy.

This project documents work, decisions, and validation in Markdown.
`./check.sh` is the gate: it builds the test image and runs the unit and browser
tests in Docker. There is no build or release tooling; do not invent it.
Where validation is unavailable, report the gap rather than claiming it passed.

## Decisions and scope

- Clarify requirements and observable acceptance criteria before implementing.
  Ask about anything affecting scope or correctness; otherwise follow existing
  conventions.
- Never choose or change architecture or stack without approval: language,
  framework, library, storage, layout, build tool, test runner. Offer options and
  a recommendation; reuse approved choices unless the requirements change.
- Get agreement before widening scope, adding a dependency, or changing a rule.
- Record task decisions in `PLAN.md`. Change these rules only for approved,
  reusable policy.
- Never skip a rule silently. If one is skipped, or costs out of proportion to
  what it returned, record it in `FRICTION.md`: that file is the only evidence
  these rules work.
- With no user available, stop at the decision. Record the open question in the
  phase, finish what does not depend on it, and never self-approve scope, stack,
  dependencies or destructive acts.

## Environment

- Keep tooling that installs things (test runners, browsers, any future build
  tool) in Docker, so the project cannot taint the host unpredictably.
  `./check.sh` does this; only the `januse` CLI (`npm run dev` /
  `januse lint|format|dev`) runs on the host.
- Use the entry points `README.md` documents, named by the agreed convention. No
  empty wrappers.
- Document stack, prerequisites, configuration, entry points, test commands and
  any release process in `README.md`, marking what works today versus planned.

## Code

- Organize by concept or feature rather than code type, as a guideline; the
  approved layout wins where they conflict.
- Prefer the smallest change that properly solves the problem. No speculative
  abstractions.
- Prefer descriptive variable/function names over comments. If the code is clear,
  it needs no comment. Comment only when absolutely necessary (non-obvious
  hardware behavior, spec-mandated magic values, API traps). One line ideally,
  two in extreme cases.
  Anything longer belongs in project documentation.
- No unrelated cleanup. Preserve public interfaces unless the task needs them
  changed. Never trade clarity for fewer lines.

## Safety and documentation

- Do not stage, commit, push, stash, branch or tag; the user owns these. Reading
  Git state is fine.
- Preserve existing user changes. Ask before destructive operations or anything
  touching external systems: deployment, publishing, production data.
- `NOTES.md` is the user's scratchpad for unfinished thinking. Do not read it or
  treat it as requirements. It is not an input to agent work, so keep secrets
  out of it.
- No secrets in source, documentation, logs or chat; use placeholders.
- Update documentation in the change that would otherwise make it stale. Report
  what changed, what was checked, the results, and anything unverified.

## Size the change first

Pick the smallest size that honestly fits and say which. If a trivial or standard
change turns out to need a decision, stop and resize it.

| Size | What it covers | What applies |
|---|---|---|
| Trivial | No behaviour change: typos, comments, formatting, doc wording | Baseline, edit, the checks covering it, diff review. No `PLAN.md` entry |
| Standard | Bounded work inside an approved phase | Steps 3 to 6, recorded as a step in the current phase |
| Phase | New capability, dependency, stack choice or scope change | All eight steps, a new phase, approval first |

## The eight steps

Iterative: when a problem appears, fix it in the step responsible and repeat the
affected validation. Never continue past a failed gate.

1. **Clarify.** Agree requirements, scope, acceptance criteria and new stack
   choices. Record them in `PLAN.md`.
2. **Plan.** Write the phase, get agreement before implementing, record the
   validation commands. Write the acceptance tests now, from the agreed criteria,
   while no implementation exists to shape them.
3. **Baseline.** Inspect existing changes, run the pre-change checks.
4. **Implement.** Small batches, with the gates below after each.
5. **Minimize.** Remove unnecessary complexity, unrelated edits and debug
   leftovers. Resulting edits pass the gates again.
6. **Harden.** Work the checklist and record the real findings.
7. **Acceptance.** Run the suite from step 2, extending it only for user-visible
   behaviour found during the work, and say so. For a release, build the
   candidate and exercise it through its public interfaces first. Building one
   authorizes nothing; publishing, tagging and deployment are separate.
8. **Close out.** Update `PLAN.md` with results and limitations. Mark Done only
   when the criteria are met, then summarize, including any `FRICTION.md` entry.

## Hardening checklist

Record what is actually there. Zero findings is valid; restating the change is
not a finding, and a quota produces padding. Fix feasible in-scope issues and
validate again; ask before expanding scope, and leave open ones in the phase.

- Correctness and edge cases: empty, maximum, malformed, duplicate input;
  ordering; idempotence
- Error handling and failure modes, including partial failure and retries
- Security: trust boundaries, secrets, permissions, injection
- Dependency and supply-chain risk from this change
- Test gaps at each tier
- Clarity: names, dead code, comments that no longer match

## Validation

A **batch** is a coherent set of edits implementing one part of the plan, not
each file save; validate one before starting the next. Code, dependencies,
scripts and build configuration need these gates. Documentation-only changes need
`./check.sh`, plus these gates where documentation feeds a build.

- Run the documented build before the first code change if its state is unknown.
  An earlier result counts only for the same code and environment.
- Build after every batch, through the documented entry point.
- A broken build or failing test stops work. Fix what the change broke and rerun.
  Report pre-existing failures and ask; do not bypass a gate or widen the task.
- Cover every change at the tier matching its risk; user-visible behaviour means
  an acceptance test. Controlled environments only, never production data.
- Missing tooling is not a passing test. Agree its setup or an explicit
  limitation; do not claim a tier is covered.

| Tier | Kind | Scope | When |
|---|---|---|---|
| Unit | Whitebox | One unit in isolation | Tests covering the change, before and after each batch |
| Integration | Whitebox | Units wired together, real internals, no external systems | Full suite after each batch |
| Acceptance | Blackbox | User-visible behaviour through public interfaces | At phase completion and before a release |

**Smoke is not a fourth tier.** It is a tagged subset of acceptance, run after
each batch, covering paths whose breakage makes the build worthless, capped at
**2 minutes**. Past that, trim it rather than grow it.

Per-batch gates together stay under **5 minutes**. When integration exceeds that,
split it: a fast set per batch, the full suite per phase, with measured timings
in `PLAN.md`. These are defaults; changing them is the user's decision.

## PLAN.md and FRICTION.md

`PLAN.md` is phase history, not a second rules file. Keep `## Current`,
`## Planned` and `## Done`, newest first, updated during the work. A phase has a
title and status; a **Goal** of one or two sentences; small checkable **Steps**;
observable **Done when** criteria; and **Decisions**, **Validation** and
**Limitations** as they apply, recording what was checked and what it returned.
Past ten entries under `## Done`, move the oldest to `PLAN-archive.md`.

`FRICTION.md` records where a rule cost more than it returned; read it before
revising these rules.