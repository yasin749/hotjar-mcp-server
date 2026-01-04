#!/usr/bin/env node

import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import express, { Request, Response } from "express";
import createServer from "./server.js";
import { config } from "./config/config.js";

const server = createServer();

async function startSSEServer() {
  const app = express();
  const transports: { [sessionId: string]: SSEServerTransport } = {};

  app.get("/sse", async (req: Request, res: Response) => {
    console.log("New SSE connection established");
    const transport = new SSEServerTransport("/messages", res);
    transports[transport.sessionId] = transport;

    res.on("close", () => {
      console.log(`SSE connection closed: ${transport.sessionId}`);
      delete transports[transport.sessionId];
    });

    await server.connect(transport);
  });

  app.post("/messages", async (req: Request, res: Response) => {
    const sessionId = req.query.sessionId as string;
    const transport = transports[sessionId];

    if (!transport) {
      res.status(404).json({ error: "Session not found" });
      return;
    }

    await transport.handlePostMessage(req, res);
  });

  app.get("/health", (_req: Request, res: Response) => {
    res.json({ status: "ok", server: config.mcp.name, version: config.mcp.version });
  });

  const port = config.port;
  app.listen(port, () => {
    console.log(`${config.mcp.name} v${config.mcp.version} running on port ${port}`);
    console.log(`SSE endpoint: http://localhost:${port}/sse`);
    console.log(`Health check: http://localhost:${port}/health`);
  });
}

async function startStdioServer() {
  console.error(`Starting ${config.mcp.name} v${config.mcp.version} in stdio mode`);
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

// Determine transport mode based on command line args or environment
const args = process.argv.slice(2);
const useStdio = args.includes("--stdio") || process.env.MCP_TRANSPORT === "stdio";

if (useStdio) {
  startStdioServer().catch((error) => {
    console.error("Failed to start stdio server:", error);
    process.exit(1);
  });
} else {
  startSSEServer().catch((error) => {
    console.error("Failed to start SSE server:", error);
    process.exit(1);
  });
}
