# End-to-end results - spindoctor-qwerty-amp 1.1.0

Date: 2026-10-10 (PT). Engine: SpinDoctor Qwerty 1.1.0, SpinDoctor 3.1.2 parity (update 3.1.2-298-20261010).

## Publishing decision (recorded as required)

RUSSELL PHILIP SMITHSON approved publishing ("GO") on the basis that the **updated SpinDoctor 3.1.2** builds and passes its own test
suite **18/18**, with the three test checks that still assumed the old 29-qubit limit adapted to the new 298-qubit limit
(`engine_regressions` dense comparison restricted to gates with at most 3 operands now that `mcx7` has 8; `direct_preset_regressions`
and `csv_gate_regressions` now expect 299 qubits, not 30, to be refused). Unmodified, the update passes 15/18 because of exactly
those three stale checks.

## Reference used

All parity comparisons use reference outputs regenerated from the **updated** SpinDoctor 3.1.2 C# build (241 presets in one
session, the folder-ingest chug series, and direct wide-register commands).

## Shared engine (Phase A, run once for all repos)

| Suite | Result |
|---|---|
| 241 presets replayed against the updated 3.1.2 reference | 236 identical; 5 with documented differences (qc-006, qc-008, qc-009, qc-016, qc-019: OpenCL GPU fields absent in a CPU-only engine, tranche checkpoint wording, session-state file name). qc-198 fails preflight in both C# and the engine (`q.compile synthesize` is not implemented in SpinDoctor 3.1.2 either). Work-accounting counters are compared separately and documented. |
| Folder-ingest chug series (41 folders) | 40 pass; `08_cancel` not applicable (the engine runs `q.folder` synchronously, so there is nothing to cancel; the job completes correctly) |
| Wide-register parity (direct 298-qubit commands) | 0 differences |
| 11-file 298-qubit example folder | identical (73 distinct outcomes, histogram preview and counts match) |
| Engine validation suite | 22/22 |
| Theory-testing suite (files, text, chat summary, 5 transcript formats) | 43/43 |
| Function-table examples (every "Command to type") | 168/168 run OK |

## This repository: clean-room test

The staged repository was copied into a fresh empty folder under `env -i` (clean PATH, temporary HOME, no PYTHONPATH, no access to
development folders). Following the README, only the `spindoctor-qwerty` folder was copied into a fresh project's `.amp/plugins/`.

| Step | Result |
|---|---|
| `node tests/index_test.mjs` (wrapper: unknown tool refused, timeout, truncation, no event handlers, activation without `registerSkill`) | 10/10 |
| Real Amp CLI 0.0.1791676897 (`amp plugins exec .amp/plugins/spindoctor-qwerty session.start`) | plugin loads and activates, exit 0, no errors logged (a deliberately broken control plugin is reported as "Failed to load plugin") |
| Stand-in host load (`tests/amp_host_bridge.mjs --describe`) | 6 tools registered, skill `spindoctor-qwerty:spindoctor` valid (name matches directory) |
| End-to-end through the installed plugin's tools | **12/12 pass**, engine on Python 3.13.5 and on Python 3.8.20 (`SPINDOCTOR_PYTHON`) |

End-to-end checks (`tests/e2e_mcp.py` through `tests/amp_host_bridge.mjs`, which calls the plugin's registered `execute()` for the
read-only tools and `executeTool()`, the exact function `execute()` delegates to, for the others):

1. Plugin version 1.1.0; the 6 tools are registered.
2. Function table: Markdown, 19 sections, lists the 298-qubit limits; `execute()` text identical to the engine result; 241 presets listed.
3. One script per command family: 16 families, every table example runs OK.
4. 298-qubit circuit with `mcx7`: prepared-factor-Born-Z sampling, outcomes consistent.
5. `q.folder` on a mixed folder (.txt sequence, .csv commands, .json circuit, .qasm) completes; `notes.md` is skipped and listed.
6. Theory testing from a file, from a chat summary with 2 quoted excerpts, and from an exported chat transcript: all *supported*, TXT+PDF reports written.
7. Presets qc-001..qc-025 in a fresh workspace seeded with the reference seeds: 20 identical to the updated 3.1.2 reference, 5 documented differences.
8. Reports: every PDF structurally valid (header, xref, startxref offset, pages, `pdftotext` finds SpinDoctor text), each with a TXT twin.

## Host app

**Real host, partly; tool listing host-simulated.** The Amp CLI was installed for free with the official installer into an isolated
home, with no sign-in and no API key. It discovered, loaded and activated the project plugin without errors. `amp plugins list`, which
prints a plugin's tools, stops with HTTP 401 because Amp loads the account's global plugins first and that needs a sign-in, so tool
listing and tool calls were verified with the stand-in host instead. No language model was called.

## Post-push clone

Filled in after publishing.
