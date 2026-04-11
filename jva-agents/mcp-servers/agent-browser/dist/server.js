#!/usr/bin/env node
/**
 * agent-browser MCP Server
 *
 * Wraps the agent-browser CLI as an MCP server for jva-agents.
 * Used by lead-search (scraping) and outreach (LinkedIn DM) agents.
 *
 * Requires: brew install agent-browser && agent-browser install
 */
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { execSync } from "child_process";
import { z } from "zod";
const PROFILE = process.env.AGENT_BROWSER_PROFILE ?? "Default";
const TIMEOUT = parseInt(process.env.AGENT_BROWSER_TIMEOUT ?? "30000");
function run(cmd) {
    try {
        return execSync(cmd, { timeout: TIMEOUT, encoding: "utf8" }).trim();
    }
    catch (e) {
        const err = e;
        throw new Error(err.stderr?.trim() || err.message || String(e));
    }
}
const server = new McpServer({ name: "agent-browser", version: "1.0.0" });
// Navigate to URL — uses Chrome profile to preserve login state (e.g. LinkedIn)
server.tool("open", "Navigate to a URL. Uses the saved Chrome profile so LinkedIn sessions persist.", { url: z.string().url().describe("URL to open") }, async ({ url }) => {
    const out = run(`agent-browser --profile ${PROFILE} open ${JSON.stringify(url)}`);
    return { content: [{ type: "text", text: out || `Opened: ${url}` }] };
});
// Accessibility snapshot — returns refs (@e1, @e2 ...) for subsequent clicks/fills
server.tool("snapshot", "Return the accessibility tree of the current page with element refs (@e1, @e2, ...). Use refs for click/fill commands.", {}, async () => {
    const out = run(`agent-browser snapshot`);
    return { content: [{ type: "text", text: out }] };
});
// Click element by ref or selector
server.tool("click", "Click an element. Pass a ref from snapshot (e.g. @e3) or a CSS selector.", { ref: z.string().describe("Element ref (@e3) or CSS selector") }, async ({ ref }) => {
    const out = run(`agent-browser click ${ref}`);
    return { content: [{ type: "text", text: out || "Clicked" }] };
});
// Fill (clear + type) — primary input method for forms and DM text areas
server.tool("fill", "Clear a field and fill it with text. Pass a ref from snapshot (e.g. @e5) or CSS selector.", {
    ref: z.string().describe("Element ref (@e5) or CSS selector"),
    text: z.string().describe("Text to fill in"),
}, async ({ ref, text }) => {
    const out = run(`agent-browser fill ${ref} ${JSON.stringify(text)}`);
    return { content: [{ type: "text", text: out || "Filled" }] };
});
// Press key — useful for Enter to submit forms/DMs
server.tool("press", "Press a keyboard key. Use 'Enter' to submit forms or DMs.", { key: z.string().describe("Key name e.g. Enter, Tab, Escape, Control+a") }, async ({ key }) => {
    const out = run(`agent-browser press ${JSON.stringify(key)}`);
    return { content: [{ type: "text", text: out || `Pressed ${key}` }] };
});
// Wait — let slow pages settle or wait for elements to appear
server.tool("wait", "Wait for a number of milliseconds (for slow pages) or for an element selector to appear.", { ms: z.number().int().min(100).max(10000).describe("Milliseconds to wait") }, async ({ ms }) => {
    const out = run(`agent-browser wait ${ms}`);
    return { content: [{ type: "text", text: out || `Waited ${ms}ms` }] };
});
// Screenshot — for debugging; saves to /tmp
server.tool("screenshot", "Take a screenshot of the current page for debugging. Returns the saved file path.", {}, async () => {
    const path = `/tmp/agent-browser-${Date.now()}.png`;
    run(`agent-browser screenshot ${path}`);
    return { content: [{ type: "text", text: `Screenshot saved: ${path}` }] };
});
// Get page text — useful for verifying page content without full snapshot
server.tool("get_text", "Get the text content of an element or the entire page body.", {
    ref: z
        .string()
        .optional()
        .describe("Element ref (@e1) or CSS selector. Omit for full page text."),
}, async ({ ref }) => {
    const target = ref ?? "body";
    const out = run(`agent-browser get text ${target}`);
    return { content: [{ type: "text", text: out }] };
});
const transport = new StdioServerTransport();
await server.connect(transport);
