#!/usr/bin/env node
// SpinDoctor Qwerty 1.1.0 - Amp plugin tests
// Copyright (C) 2026 RUSSELL PHILIP SMITHSON <russellsmithson77@outlook.com>
// SPDX-License-Identifier: GPL-3.0-or-later
// This program is free software: you can redistribute it and/or modify it under the terms of the GNU General
// Public License as published by the Free Software Foundation, either version 3 of the License, or (at your
// option) any later version. It is distributed WITHOUT ANY WARRANTY; see the LICENSE file for details.
// Unit tests for the Amp plugin wrapper (no Amp needed): node tests/index_test.mjs
import path from "node:path";
import assert from "node:assert/strict";
import { fileURLToPath, pathToFileURL } from "node:url";
const HERE = path.dirname(fileURLToPath(import.meta.url));
const url = pathToFileURL(path.join(HERE, "..", "spindoctor-qwerty", "index.js")).href;
const m = await import(url);
let n = 0; const ok = (name) => { n++; console.log("PASS " + name); };
assert.equal(m.VERSION, "1.1.0"); ok("version 1.1.0");
assert.equal(m.TOOL_DEFS.length, 6); ok("6 tool definitions");
for (const d of m.TOOL_DEFS) assert.equal(d.parameters.type, "object");
ok("every inputSchema is an object schema");
assert.match((await m.callEngine("rm_rf", {})).error, /Unknown SpinDoctor tool/); ok("unknown tool refused before spawning");
const f = await m.callEngine("spindoctor_functions", {}); assert.ok(f.ok && f.markdown.includes("| Function |")); ok("function table via the engine");
assert.equal(m.asText(f), f.markdown); ok("function table returned verbatim");
const big = m.asText({ ok: false, error: "x".repeat(70000) }); assert.ok(big.length < 61000 && big.endsWith("full output]")); ok("long output truncated with a pointer to the reports");
const t = await m.callEngine("spindoctor_run_script", { script: "q.circuit new slow 2" }, 1); assert.match(t.error, /timed out/); ok("timeout reported");
const regs = []; await m.default({ registerTool: (d) => regs.push(d.name), registerSkill: async () => {}, on: () => { throw new Error("no hooks allowed"); } });
assert.equal(regs.length, 6); ok("activation registers 6 tools and no event handlers");
await m.default({ registerTool: () => {} }); ok("older Amp without registerSkill still activates");
console.log("UNIT " + n + "/" + n + " passed");
