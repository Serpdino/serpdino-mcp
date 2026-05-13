#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { SerpDinoClient } from "./client.js";
// @ts-ignore — shared JS module, no types needed
import registerTools from "./mcpTools.js";

const SERPDINO_API_KEY = process.env.SERPDINO_API_KEY;
const SERPDINO_BASE_URL = process.env.SERPDINO_BASE_URL || "https://serpdino.com";

if (!SERPDINO_API_KEY) {
    console.error(
        "Error: SERPDINO_API_KEY environment variable is required.\n" +
        "Get your API key at https://serpdino.com → Dashboard → Settings → API Keys"
    );
    process.exit(1);
}

const client = new SerpDinoClient(SERPDINO_API_KEY, SERPDINO_BASE_URL);

const server = new McpServer({
    name: "serpdino",
    version: "1.0.0",
});

registerTools(server, client, z, SERPDINO_BASE_URL);

async function main() {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error("SerpDino MCP Server running on stdio");
}

main().catch((error) => {
    console.error("Fatal error:", error);
    process.exit(1);
});
