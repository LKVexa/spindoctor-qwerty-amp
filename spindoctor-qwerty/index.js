// SpinDoctor Qwerty 1.1.0 - Amp plugin
// Copyright (C) 2026 RUSSELL PHILIP SMITHSON <russellsmithson77@outlook.com>
// SPDX-License-Identifier: GPL-3.0-or-later
// This program is free software: you can redistribute it and/or modify it under the terms of the GNU General
// Public License as published by the Free Software Foundation, either version 3 of the License, or (at your
// option) any later version. It is distributed WITHOUT ANY WARRANTY; see the LICENSE file for details.
// SpinDoctor Qwerty for Amp - directory plugin entry (https://ampcode.com/docs/customize/plugins).
// Registers the SpinDoctor tools and the bundled skill. Every tool call shells out to the bundled,
// standard-library-only Python engine (engine/scripts/spindoctor_cli.py tool <name>). No event handlers,
// no network access, nothing runs until the model calls a tool.
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";

export const description = "SpinDoctor 3.1.2 quantum-circuit SIMULATOR (classical FP64): q.* scripts, 241 presets, q.folder, theory testing, TXT/PDF/JSON/CSV reports.";
export const VERSION = "1.1.0";
const HERE = path.dirname(fileURLToPath(import.meta.url));
export const ENGINE_CLI = process.env.SPINDOCTOR_QWERTY_CLI || path.resolve(HERE, "engine", "scripts", "spindoctor_cli.py");
export const PYTHON = process.env.SPINDOCTOR_PYTHON || (process.platform === "win32" ? "python" : "python3");
export const GUARDRAIL = "Classical FP64 simulation on this computer; not a quantum computer; no quantum advantage claimed.";
const TIMEOUT_MS = Number(process.env.SPINDOCTOR_TIMEOUT_MS) > 0 ? Number(process.env.SPINDOCTOR_TIMEOUT_MS) : 600000;
const MAX_OUTPUT = 64 * 1024 * 1024; // refuse runaway output instead of exhausting memory
const TEXT_LIMIT = 60000;            // characters returned to the model; full output stays in the report files

export const TOOL_DEFS = [
  {"name": "spindoctor_run_script", "description": "Run one or more SpinDoctor q.* commands (one per line) in the persistent simulator workspace and return each result plus TXT/JSON/PDF report paths. Classical FP64 simulation only; not a quantum computer. Example: 'q.circuit new bell 2\\nq.circuit add h 0\\nq.circuit add cx 0 1\\nq.circuit run shots 1000 basis z'.", "parameters": {"type": "object", "properties": {"script": {"type": "string", "description": "q.* commands, one per line; blank lines and # comments are ignored."}, "workspace": {"type": "string", "description": "Optional workspace folder (default ~/spindoctor-workspace or $SPINDOCTOR_WORKSPACE)."}}, "required": ["script"], "additionalProperties": false}},
  {"name": "spindoctor_run_preset", "description": "Run one of the 241 built-in SpinDoctor presets (qc-001..qc-241) with optional name=value overrides; returns per-step results and report paths.", "parameters": {"type": "object", "properties": {"preset_id": {"type": "string", "description": "Preset id such as qc-061."}, "overrides": {"type": "object", "description": "Optional overrides (shots, basis, qubits, input, angle).", "additionalProperties": {"type": "string"}}, "workspace": {"type": "string"}}, "required": ["preset_id"], "additionalProperties": false}},
  {"name": "spindoctor_list_presets", "description": "List the SpinDoctor presets (id, category, label, availability, commands). Optional case-insensitive filter text.", "parameters": {"type": "object", "properties": {"filter": {"type": "string"}, "workspace": {"type": "string"}}, "additionalProperties": false}},
  {"name": "spindoctor_report", "description": "Return the text of a SpinDoctor report (TXT) from the workspace, or list the newest reports when no name is given.", "parameters": {"type": "object", "properties": {"name": {"type": "string", "description": "Report file name or path relative to <workspace>/reports (e.g. qc-061.txt)."}, "limit": {"type": "integer", "description": "How many recent reports to list (default 20)."}, "workspace": {"type": "string"}}, "additionalProperties": false}},
  {"name": "spindoctor_functions", "description": "Return the in-chat Markdown table of EVERY SpinDoctor function: columns Function | What it does | Command to type, grouped by command family, with real runnable examples (plus the 241 presets with section='presets'). Show the table to the user verbatim when they ask what the plugin can do, ask for help/functions, or on first use.", "parameters": {"type": "object", "properties": {"section": {"type": "string", "enum": ["commands", "gates", "tools", "presets", "all"], "description": "commands (default: tools + every q.* family + gates), gates, tools, presets (241 rows) or all."}, "filter": {"type": "string", "description": "Optional case-insensitive text filter (e.g. 'tranche', 'noise', 'grover')."}}, "additionalProperties": false}},
  {"name": "spindoctor_test_theory", "description": "Test a theory/experiment with the simulator and write a TXT+JSON+PDF theory test report (hypothesis, script, raw results, verdict supported / not supported / inconclusive, limits). source='file': a .txt/.md/.pdf/.py/.json/.csv/.q attachment by local path; source='text': pasted text; source='chat': a theory summary the AI wrote from the conversation and the user confirmed, plus optional quoted excerpts and/or an exported chat transcript (.txt/.md/.json/.html). Use action='extract' first to read the source, then action='run' with hypothesis, prediction, checks and a q.* script. The plugin cannot read chat history or host attachments by itself.", "parameters": {"type": "object", "properties": {"action": {"type": "string", "enum": ["extract", "run"], "description": "extract = read/parse the source only; run (default) = run the script, compare, write the report."}, "source": {"type": "string", "enum": ["file", "text", "chat"], "description": "Where the theory comes from."}, "path": {"type": "string", "description": "Local path of the attachment (source=file) or of an exported chat transcript (source=chat)."}, "text": {"type": "string", "description": "Pasted theory text (source=text) or the confirmed theory summary: claims, assumptions, variables, measurable prediction (source=chat)."}, "excerpts": {"type": "array", "items": {"type": "string"}, "description": "source=chat: verbatim quotes from the conversation, e.g. 'User: ...', 'Assistant: ...'."}, "hypothesis": {"type": "string", "description": "The hypothesis restated in one or two sentences (required for run)."}, "prediction": {"type": "string", "description": "The measurable prediction in words (required for run)."}, "checks": {"type": "array", "items": {"type": "object"}, "description": "Machine checks. {kind:'probability', outcome:'00', expected:0.5, tolerance:0.05, command?:N} (bitstrings: qubit 0 is the RIGHTMOST bit; uses the last histogram or zero/one counts) | {kind:'value', command:N, path:'result.fidelity', op:'approx|eq|ne|lt|le|gt|ge|contains|true|false', value:X, tolerance?:T} | {kind:'ok', command:N, expected:true}."}, "script": {"type": "string", "description": "q.* commands, one per line (defaults to q.* lines found in the source)."}, "assumptions": {"type": "array", "items": {"type": "string"}}, "variables": {"type": "array", "items": {"type": "string"}}, "title": {"type": "string"}, "workspace": {"type": "string"}, "isolate": {"type": "boolean", "description": "Default true: run in a fresh sub-workspace (<workspace>/theory-runs/<id>) so names never collide; false = use the shared workspace state."}}, "additionalProperties": false}}
];
const TOOL_NAMES = new Set(TOOL_DEFS.map((d) => d.name));

/** Run one engine tool call: JSON arguments on stdin, one JSON result line on stdout. */
export function callEngine(tool, args, timeoutMs = TIMEOUT_MS) {
  return new Promise((resolve) => {
    if (!TOOL_NAMES.has(tool)) { resolve({ ok: false, error: "Unknown SpinDoctor tool: " + String(tool) }); return; }
    let out = "", err = "", timedOut = false, overflow = false, child;
    try {
      child = spawn(PYTHON, [ENGINE_CLI, "tool", tool], {
        stdio: ["pipe", "pipe", "pipe"], windowsHide: true, shell: false,
        env: { ...process.env, PYTHONUTF8: "1", PYTHONIOENCODING: "utf-8", PYTHONDONTWRITEBYTECODE: "1" },
      });
    } catch (e) { resolve({ ok: false, error: "Could not start Python (" + PYTHON + "): " + e.message }); return; }
    const timer = setTimeout(() => { timedOut = true; child.kill(); }, timeoutMs);
    child.stdout.setEncoding("utf8"); child.stderr.setEncoding("utf8");
    child.stdout.on("data", (d) => { out += d; if (out.length > MAX_OUTPUT && !overflow) { overflow = true; child.kill(); } });
    child.stderr.on("data", (d) => { if (err.length < 65536) err += d; });
    child.on("error", (e) => { clearTimeout(timer); resolve({ ok: false, error: "Python 3.8+ is required (set SPINDOCTOR_PYTHON): " + e.message }); });
    child.on("close", () => {
      clearTimeout(timer);
      if (timedOut) { resolve({ ok: false, error: "SpinDoctor engine timed out after " + timeoutMs + " ms (set SPINDOCTOR_TIMEOUT_MS)." }); return; }
      if (overflow) { resolve({ ok: false, error: "SpinDoctor engine output exceeded 64 MiB; use the report files instead." }); return; }
      const line = out.trim().split("\n").pop() || "";
      try { resolve(JSON.parse(line)); } catch { resolve({ ok: false, error: (err || out || "no output from the engine").slice(-2000) }); }
    });
    child.stdin.on("error", () => {}); // engine may exit before reading all input
    child.stdin.end(JSON.stringify(args && typeof args === "object" ? args : {}));
  });
}

/** Text shown to the model: the function table verbatim, otherwise compact JSON (truncated; reports hold the rest). */
export function asText(result) {
  if (result && result.ok && typeof result.markdown === "string") return result.markdown;
  const s = JSON.stringify(result, null, 1);
  return s.length > TEXT_LIMIT ? s.slice(0, TEXT_LIMIT) + "\n...[truncated; open the report files for full output]" : s;
}

/** What each registered tool's execute() runs. `onResult` (optional) receives the full structured result. */
export async function executeTool(name, input, onResult) {
  const result = await callEngine(name, input || {});
  if (typeof onResult === "function") onResult(result);
  return asText(result);
}

export default async function (amp) {
  for (const def of TOOL_DEFS) {
    amp.registerTool({
      name: def.name,
      description: def.description,
      inputSchema: def.parameters,
      async execute(input) { return executeTool(def.name, input); },
    });
  }
  // Bundled skill (Amp lists it as spindoctor-qwerty:spindoctor). Older Amp builds without registerSkill still get the tools.
  if (typeof amp.registerSkill === "function") {
    try { await amp.registerSkill({ path: "skills/spindoctor" }); } catch (e) { amp.logger?.log?.("SpinDoctor skill not registered: " + e.message); }
  }
}
