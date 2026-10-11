# SpinDoctor Qwerty for Amp

**spindoctor-qwerty-amp** is an [Amp](https://ampcode.com) plugin that gives Amp's agent the SpinDoctor Qwerty quantum-circuit
**simulator**: build and run circuits with SpinDoctor's `q.*` commands, run any of the 241 presets, process a folder of command files
with `q.folder`, test a theory you give it, and write TXT, PDF, JSON and CSV reports.

- Version **1.1.0**, engine at **SpinDoctor 3.1.2 parity** (update 3.1.2-298-20261010).
- Host: **Amp** directory plugin (`spindoctor-qwerty/index.js`, default export registering 6 tools with `amp.registerTool`, plus a
  bundled skill `spindoctor-qwerty:spindoctor` registered with `amp.registerSkill`). No event handlers.
- Self-contained: the engine is bundled in `spindoctor-qwerty/engine/` (pure Python, standard library only, NumPy optional). Each tool
  call runs `python3 engine/scripts/spindoctor_cli.py tool <name>`. No network access, no installs.

> **Honest limits.** SpinDoctor runs classical FP64 arithmetic on your computer. It is **not** a quantum computer, never contacts
> quantum hardware, and gives no quantum speed-up or quantum advantage. Registers hold 1-298 logical qubits, but any group of
> entangled qubits (one "factor") is limited to 59 qubits, and dense factors are limited much further by memory
> (2^n x 16 bytes; about 22 qubits with the standard library, more with NumPy). Registers wider than 29 qubits sample in basis Z only.
> Python 3.8 or newer is required.

## Install (Amp)

1. Install **Python 3.8+** (`python3 --version`, or `python --version` on Windows).
2. Download or clone this repository: `git clone https://github.com/LKVexa/spindoctor-qwerty-amp`.
3. Copy the **`spindoctor-qwerty`** folder (not the whole repository) into a plugin location:
   - one project: `<project>/.amp/plugins/spindoctor-qwerty/`
   - every project on this machine: `~/.config/amp/plugins/spindoctor-qwerty/` (`$XDG_CONFIG_HOME/amp/plugins/` if set;
     `%USERPROFILE%\.config\amp\plugins\` on Windows)
4. In Amp run `plugins: reload` (command palette, Ctrl+O) or restart Amp. `amp plugins list` shows the plugin and its 6 tools.
5. Ask: *"show the SpinDoctor functions"*.

Optional environment variables: `SPINDOCTOR_PYTHON` (Python executable), `SPINDOCTOR_WORKSPACE` (reports and session state; default
`~/spindoctor-workspace`), `SPINDOCTOR_TIMEOUT_MS` (per call, default 600000), `SPINDOCTOR_QWERTY_CLI` (a different engine CLI).

**Sample theory PDFs.** `spindoctor-qwerty/engine/examples/theory/` holds sample theory files and chat transcripts. The two sample PDFs
are stored as text; run `python3 spindoctor-qwerty/engine/examples/theory/make_sample_pdfs.py` to recreate them.

## What you can ask for

## SpinDoctor Qwerty - plugin tools

| Function | What it does | Command to type |
|---|---|---|
| Function table (spindoctor_functions) | Show this table in chat | Ask: "show the SpinDoctor functions" (CLI: `spindoctor_cli.py functions`) |
| Run a script (spindoctor_run_script) | Run any q.* lines above; returns results + TXT/JSON/CSV/PDF report paths | Ask: "run q.circuit new bell 2 / q.circuit add h 0 / ..." |
| Run a preset (spindoctor_run_preset) | Run qc-001..qc-241 with overrides | Ask: "run preset qc-067 with shots=64" |
| List presets (spindoctor_list_presets) | Search the 241 presets | Ask: "list presets about Grover" |
| Read a report (spindoctor_report) | List/read TXT reports (PDF/JSON paths alongside) | Ask: "show the newest SpinDoctor report" |
| Test a theory from a file (spindoctor_test_theory source=file) | Read a .txt/.md/.pdf/.py/.json/.csv/.q attachment, then hypothesis -> prediction -> q.* script -> run -> verdict + TXT/PDF theory report | Ask: "test the theory in C:/notes/theory.md" (the host must pass the file path/content) |
| Test a theory from text (spindoctor_test_theory source=text) | Same pipeline for pasted text | Ask: "test this theory: a Hadamard on \|0> gives 50/50" |
| Test the theory we discussed (spindoctor_test_theory source=chat) | The AI summarises the theory from the conversation (claims, assumptions, variables, prediction), you confirm, then it is tested; quoted excerpts go in the report under 'Source: chat history'. An exported chat transcript (.txt/.md/.json/.html) also works | Ask: "test the theory we discussed" or "test the theory in my exported chat C:/chats/conversation.json" |

Every command family is listed with a runnable example in **[FUNCTIONS.md](FUNCTIONS.md)** (the exact table the tool shows):
circuits (`q.circuit`, including 298-qubit wide registers and the `mcx7` gate), queries (`q.query`), the tranche register
(`q.tranche`), the procedural grid, presets and sequences, resource planning, math calculators, physics models, lessons, noise, error
correction, compilation, algorithms, inputs/folders/history (`q.input`, `q.folder`, `q.history`) and the cartridge commands.

## Theory testing

`spindoctor_test_theory` turns a claim into a test: hypothesis -> measurable prediction -> `q.*` script -> run -> compare -> a TXT +
JSON + PDF **theory test report** with the hypothesis, script, raw results, verdict (*supported*, *not supported* or *inconclusive*)
and limits.

- **From a file:** .txt, .md, .pdf, .py, .json, .csv or .q. In Amp, @-mention the file or give its path in the workspace.
- **From pasted text.**
- **From the chat history:** say *"test the theory we discussed"*. The agent writes a short summary (claims, assumptions, variables,
  measurable prediction), shows it to you to confirm or correct, then passes it with optional quoted excerpts; the report records them
  under *Source: chat history*. Exported chat transcripts (.txt/.md/.json/.html from ChatGPT, Claude and others) also work.
- The plugin cannot read your thread or attachments by itself: only the agent sees the conversation, and very long threads may already
  be truncated by the context window.

## Folder ingestion (`q.folder`)

`q.folder run path="<folder>"` runs every supported file at the top level of a folder (.txt, .csv, .json, .qasm, .qasm2, .circuit,
.pdf) in ordinal name order: 1-128 supported files, at most 4 MiB per file, 1-128 commands per file and 4096 characters per command,
strict UTF-8. Other files (for example .md) are skipped and listed. The first failing file stops the job.

## Testing

| Test | Command | Result for 1.1.0 |
|---|---|---|
| Wrapper unit tests | `node tests/index_test.mjs` | 10/10 |
| End-to-end through the plugin (Amp stand-in host) | `python3 tests/e2e_mcp.py --server node tests/amp_host_bridge.mjs --examples spindoctor-qwerty/engine/examples/theory` | 12/12 |
| Real Amp CLI loads the plugin | `amp plugins exec .amp/plugins/spindoctor-qwerty session.start` | loads and activates without errors |

**host-simulated (tool listing):** the real Amp CLI was installed for free and loads and activates the plugin. Listing a plugin's tools
(`amp plugins list`) needs an Amp sign-in, which was not used, so the tools were exercised through the stand-in host
`tests/amp_host_bridge.mjs`. It loads the plugin the way Amp does, checks the tool and skill registrations, and drives the tools.
Details in [E2E_RESULTS.md](E2E_RESULTS.md).

## Author and license

Author: **RUSSELL PHILIP SMITHSON** <russellsmithson77@outlook.com>

Copyright (C) 2026 RUSSELL PHILIP SMITHSON. Licensed under the GNU General Public License v3.0 or later
(`GPL-3.0-or-later`): see [LICENSE](LICENSE), [NOTICE](NOTICE) and [COPYRIGHT](COPYRIGHT).
