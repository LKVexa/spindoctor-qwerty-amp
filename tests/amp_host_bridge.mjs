#!/usr/bin/env node
// SpinDoctor Qwerty 1.1.0 - Amp stand-in host
// Copyright (C) 2026 RUSSELL PHILIP SMITHSON <russellsmithson77@outlook.com>
// SPDX-License-Identifier: GPL-3.0-or-later
// This program is free software: you can redistribute it and/or modify it under the terms of the GNU General
// Public License as published by the Free Software Foundation, either version 3 of the License, or (at your
// option) any later version. It is distributed WITHOUT ANY WARRANTY; see the LICENSE file for details.
// Amp stand-in host: loads the plugin exactly as Amp does (default export called with a PluginAPI-like object),
// collects the registered tools and the bundled skill, and exposes those tools over a minimal stdio MCP
// (JSON-RPC 2.0) loop so tests/e2e_mcp.py can drive them. Tool calls go through each tool's own execute().
// usage: node tests/amp_host_bridge.mjs [path/to/spindoctor-qwerty]
import path from "node:path";
import fs from "node:fs";
import readline from "node:readline";
import { fileURLToPath, pathToFileURL } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const argDir = process.argv.slice(2).find((a) => !a.startsWith("--"));
const pluginDir = path.resolve(argDir || path.join(HERE, "..", "spindoctor-qwerty"));
const mod = await import(pathToFileURL(path.join(pluginDir, "index.js")).href);
const tools = new Map(); const skills = []; const log = [];
const amp = {
  logger: { log: (...a) => log.push(a.join(" ")) },
  registerTool(def) {
    for (const k of ["name", "description", "inputSchema", "execute"]) if (!def[k]) throw new Error("registerTool missing " + k);
    if (def.inputSchema.type !== "object") throw new Error("inputSchema.type must be object");
    if (tools.has(def.name)) throw new Error("duplicate tool " + def.name);
    tools.set(def.name, def); return { dispose() {} };
  },
  async registerSkill({ path: rel }) {
    const dir = path.join(pluginDir, rel), md = path.join(dir, "SKILL.md");
    if (!fs.existsSync(md)) throw new Error("skill has no SKILL.md: " + rel);
    const front = fs.readFileSync(md, "utf8").match(/^---\n([\s\S]*?)\n---/);
    const name = front && (front[1].match(/^name:\s*(.+)$/m) || [])[1];
    if (name !== path.basename(dir)) throw new Error("skill name '" + name + "' must match directory '" + path.basename(dir) + "'");
    skills.push(path.basename(pluginDir) + ":" + name); return { dispose() {} };
  },
  on() { throw new Error("SpinDoctor must not register event handlers"); },
};
await mod.default(amp);
if (process.argv.includes("--describe")) { console.log(JSON.stringify({ tools: [...tools.keys()], skills, description: mod.description, version: mod.VERSION })); process.exit(0); }

const send = (o) => process.stdout.write(JSON.stringify(o) + "\n");
const rl = readline.createInterface({ input: process.stdin });
let queue = Promise.resolve();
rl.on("line", (line) => { queue = queue.then(() => handle(line)); });
async function handle(line) {
  if (!line.trim()) return;
  const msg = JSON.parse(line); const id = msg.id;
  if (id === undefined || id === null) return;
  try {
    if (msg.method === "initialize") send({ jsonrpc: "2.0", id, result: { protocolVersion: "2025-06-18", capabilities: { tools: {} }, serverInfo: { name: "spindoctor-qwerty (amp stand-in)", version: mod.VERSION }, skills } });
    else if (msg.method === "tools/list") send({ jsonrpc: "2.0", id, result: { tools: [...tools.values()].map((t) => ({ name: t.name, description: t.description, inputSchema: t.inputSchema })) } });
    else if (msg.method === "tools/call") {
      const t = tools.get(msg.params.name); if (!t) throw new Error("unknown tool " + msg.params.name);
      // Read-only tools go through the registered execute(); state-changing ones through executeTool(), the exact
      // function execute() delegates to, so the full structured result is available without running them twice.
      let structured, text;
      if (["spindoctor_functions", "spindoctor_list_presets"].includes(t.name)) {
        text = await t.execute(msg.params.arguments || {}, { logger: amp.logger });
        structured = await mod.callEngine(t.name, msg.params.arguments || {});
        if (mod.asText(structured) !== text) throw new Error("execute() text differs from the engine result for " + t.name);
      } else {
        text = await mod.executeTool(t.name, msg.params.arguments || {}, (r) => { structured = r; });
      }
      send({ jsonrpc: "2.0", id, result: { content: [{ type: "text", text }], structuredContent: structured, isError: !structured.ok } });
    } else send({ jsonrpc: "2.0", id, error: { code: -32601, message: "Method not found" } });
  } catch (e) { send({ jsonrpc: "2.0", id, error: { code: -32603, message: String(e && e.message || e) } }); }
}
