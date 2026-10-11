# Changelog

## 1.1.0 (2026-10-10)

- Engine rebased on **SpinDoctor 3.1.2** (update 3.1.2-298-20261010): 1-298 logical qubits with 59-qubit entangled factors,
  prepared-factor Born-Z sampling above 29 qubits, the `mcx7` gate, wide basis indices, `q.folder` with 3.1.2 semantics,
  CSV report copies and measurement-CSV fitting equations. 241 presets replayed against the updated 3.1.2 reference.
- New tools: `spindoctor_functions` (in-chat function table) and `spindoctor_test_theory` (file, pasted text, chat history,
  exported chat transcripts). Tool schemas now come straight from the engine.
- Amp plugin: bundled skill registered with `amp.registerSkill` (`spindoctor-qwerty:spindoctor`, the current Amp plugin API);
  `description` export; unknown tool names refused before spawning; clear timeout and 64 MiB output-limit errors;
  `SPINDOCTOR_TIMEOUT_MS`; UTF-8 Python stdio (`PYTHONUTF8`); `package.json` with `"type": "module"`, license and author;
  activation still works on Amp builds without `registerSkill`. Still no event handlers.
- Docs: README states the 3.1.2 limits (was "1..29 qubits"), install locations per the current Amp docs.
- Optional reproducibility: `SPINDOCTOR_MEASUREMENT_SEED` / `SPINDOCTOR_FIELD_SEED` (64 hex characters) seed a new workspace.

## 1.0.0

- First release (SpinDoctor 3.0.3 semantics).
