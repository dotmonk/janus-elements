# Friction

Where a rule in `AGENTS.md` was skipped, or cost more than it returned. Newest
first.

## 2026-10-30 — PLAN.md archive rule not applied

**Rule:** past ten entries under `## Done`, move the oldest to
`PLAN-archive.md`.
**What happened:** `## Done` held 55 phases before the RichTextarea
consistency pass added the 56th. Archiving 46 entries would have been
unrelated cleanup in that phase, so it was skipped.
**Status:** resolved the same day; the user chose to archive in one go, and
46 entries moved to `PLAN-archive.md`, leaving ten under `## Done`.

## 2026-10-30 — WebKit page.goto timeouts in the final gate

**Rule:** a failing test stops work; fix it and rerun.
**What happened:** one `./check.sh` run in the RichTextarea consistency pass had
two WebKit `page.goto` 30 s timeouts, in docs and style specs that the change
does not touch. Two unchanged reruns passed all 471 tests.
**Cost:** two extra gate runs (about 2.5 minutes).
**Status:** recurred on 2026-10-31 (toolbar additions phase: docs and style
specs, same `page.goto` timeout, unchanged rerun green). Open: whether to set
Playwright `retries` for WebKit; that changes the gate, so it is the user's
call.

## 2026-10-24 — Intermittent Docker build failures

**Rule:** a broken build stops work; fix it and rerun.
**What happened:** `docker build` failed four times (Phases 3, 13, 14 and 18) with
a BuildKit "parent snapshot does not exist" error, unrelated to the project.
An unchanged retry passed each time.
**Cost:** a wasted gate run each time, and one probe that silently ran against
a stale image before the cause was noticed.
**Status:** mitigated in Phase 33 — `./check.sh` retries `docker build` up to
three times. Pruning the Colima build cache remains optional host hygiene.

## 2026-10-23 — Pre-existing bug found by a new regression spec (Phase 4)

**Rule:** report pre-existing failures and ask; do not bypass a gate or widen
the task.
**What happened:** a new gallery spec failed before any Phase 4 change, because
Select's options are unreachable in a scrolled panel. Fixing Select was outside
the phase, so the new spec runs in a 1600 px tall viewport and the bug is
recorded under Follow-ups with a proposed one-line fix.
**Cost:** a judgement call on whether the taller viewport counts as bypassing a
gate. No existing gate was relaxed; the spec is new.
**Status:** resolved the same day; the user approved the fix and the
workaround was removed.

## 2026-10-23 — Docker rule not applied (Phase 1)

**Rule:** put the build environment in Docker once the stack is approved.
**What happened:** Phase 1 recorded the stack and added Node as the test runner,
but the tests ran on the host.
**Status:** resolved in Phase 2; `./check.sh` runs everything in Docker. The
stale `AGENTS.md` carve-out was rewritten on 2026-10-23, after the user said
the file is a template to adjust to the project.

## 2026-10-23 — Acceptance tier not automated (Phase 1)

**Rule:** user-visible behaviour needs an acceptance test through public
interfaces; smoke runs after each batch.
**What happened:** the public interface (`t`, `Component`) needs a browser, and
no browser test tool was approved. Acceptance was the existing `test.html` and
the demo pages, driven by hand through a host-installed headless Chrome. There
was no smoke set.
**Cost:** each check was a manual step that `./check.sh` did not repeat.
**Status:** resolved in Phase 2 with Playwright in Docker.

## 2026-10-23 — The one gate did not exist

**Rule:** "`./check.sh` is the one gate that exists"; documentation changes need
it.
**What happened:** `check.sh`, `PLAN.md` and `FRICTION.md` were all missing, so
no change, documentation included, could be validated as the rules require.
**Status:** resolved in Phase 1; `check.sh` now runs the Node unit tests.
