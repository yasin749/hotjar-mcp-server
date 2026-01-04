import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { HotjarService } from "./services/hotjar/hotjar.service.js";
import { HotjarAuthenticationError, HotjarRateLimitError } from "./services/hotjar/hotjar.service.errors.js";
import { HotjarCredentials } from "./services/hotjar/hotjar.service.types.js";
import { errorResponse, successResponse } from "./utils/mcp.js";
import { config } from "./config/config.js";

const hotjarService = new HotjarService();

function createServer(): McpServer {
  const server = new McpServer({
    name: config.mcp.name,
    version: config.mcp.version,
  });

  server.tool(
    "getHotjarSurveys",
    "Get surveys for a specific Hotjar site",
    {
      clientId: z.string().optional().describe("Hotjar Client ID"),
      clientSecret: z.string().optional().describe("Hotjar Client Secret"),
      siteId: z.string().optional().describe("Hotjar site ID"),
      cursor: z.string().optional().describe("Cursor for pagination next page(from previous response's next_cursor field). Omit for first page."),
    },
    async (params) => {
      try {
        const credentials: HotjarCredentials = {
          clientId: params.clientId || config.hotjar.clientId,
          clientSecret: params.clientSecret || config.hotjar.clientSecret,
        };
        const siteId = params.siteId || config.hotjar.siteId;

        if (!siteId) {
          return errorResponse("Site ID is required. Either pass siteId parameter or set HOTJAR_SITE_ID environment variable.");
        }

        if (!credentials.clientId || !credentials.clientSecret) {
          return errorResponse("Hotjar credentials are required. Either pass clientId/clientSecret parameters or set HOTJAR_CLIENT_ID and HOTJAR_CLIENT_SECRET environment variables.");
        }

        const result = await hotjarService.getSurveys(
          credentials,
          siteId,
          params.cursor,
        );

        return successResponse(`Hotjar Surveys for Site ${siteId};
                Response: ${JSON.stringify(result, null, 2)}
                Pagination Info: To fetch the next page, call this tool again with cursor. If null next_cursor, this means no more results.`);
      } catch (error: unknown) {
        if (error instanceof HotjarAuthenticationError) {
          return errorResponse(`Authentication Error: ${error.message}`);
        }

        if (error instanceof HotjarRateLimitError) {
          return errorResponse(`Rate Limit Error: ${error.message}. Resets at: ${error.resetAt.toISOString()}`);
        }

        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        return errorResponse(`Error fetching Hotjar surveys: ${errorMessage}`);
      }
    }
  );

  server.tool(
    "getHotjarSurveyDetails",
    "Get detailed information for a specific Hotjar survey",
    {
      clientId: z.string().optional().describe("Hotjar Client ID"),
      clientSecret: z.string().optional().describe("Hotjar Client Secret"),
      siteId: z.string().optional().describe("Hotjar site ID"),
      surveyId: z.string().optional().describe("Hotjar survey ID"),
    },
    async (params) => {
      try {
        const credentials: HotjarCredentials = {
          clientId: params.clientId || config.hotjar.clientId,
          clientSecret: params.clientSecret || config.hotjar.clientSecret,
        };
        const siteId = params.siteId || config.hotjar.siteId;
        const surveyId = params.surveyId || config.hotjar.surveyId;

        if (!siteId) {
          return errorResponse("Site ID is required. Either pass siteId parameter or set HOTJAR_SITE_ID environment variable.");
        }

        if (!surveyId) {
          return errorResponse("Survey ID is required. Either pass surveyId parameter or set HOTJAR_SURVEY_ID environment variable.");
        }

        if (!credentials.clientId || !credentials.clientSecret) {
          return errorResponse("Hotjar credentials are required. Either pass clientId/clientSecret parameters or set HOTJAR_CLIENT_ID and HOTJAR_CLIENT_SECRET environment variables.");
        }

        const result = await hotjarService.getSurveyDetails(
          credentials,
          siteId,
          surveyId
        );

        return successResponse(`Hotjar Survey Details for Survey ${surveyId};
              Response: ${JSON.stringify(result, null, 2)}`);
      } catch (error: unknown) {
        if (error instanceof HotjarAuthenticationError) {
          return errorResponse(`Authentication Error: ${error.message}`);
        }

        if (error instanceof HotjarRateLimitError) {
          return errorResponse(`Rate Limit Error: ${error.message}. Resets at: ${error.resetAt.toISOString()}`);
        }

        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        return errorResponse(`Error fetching Hotjar survey details: ${errorMessage}`);
      }
    }
  );

  server.tool(
    "getHotjarSurveyResponses",
    "Get responses for a specific Hotjar survey",
    {
      clientId: z.string().optional().describe("Hotjar Client ID"),
      clientSecret: z.string().optional().describe("Hotjar Client Secret"),
      siteId: z.string().optional().describe("Hotjar site ID"),
      surveyId: z.string().optional().describe("Hotjar survey ID"),
      cursor: z.string().optional().describe("Cursor for pagination next page (from previous response's next_cursor field). Omit for first page."),
    },
    async (params) => {
      try {
        const credentials: HotjarCredentials = {
          clientId: params.clientId || config.hotjar.clientId,
          clientSecret: params.clientSecret || config.hotjar.clientSecret,
        };
        const siteId = params.siteId || config.hotjar.siteId;
        const surveyId = params.surveyId || config.hotjar.surveyId;

        if (!siteId) {
          return errorResponse("Site ID is required. Either pass siteId parameter or set HOTJAR_SITE_ID environment variable.");
        }

        if (!surveyId) {
          return errorResponse("Survey ID is required. Either pass surveyId parameter or set HOTJAR_SURVEY_ID environment variable.");
        }

        if (!credentials.clientId || !credentials.clientSecret) {
          return errorResponse("Hotjar credentials are required. Either pass clientId/clientSecret parameters or set HOTJAR_CLIENT_ID and HOTJAR_CLIENT_SECRET environment variables.");
        }

        const result = await hotjarService.getSurveyResponses(
          credentials,
          siteId,
          surveyId,
          params.cursor,
        );

        return successResponse(`Hotjar Survey Responses for Survey ${surveyId};
              Response: ${JSON.stringify(result, null, 2)}
              Pagination Info: To fetch the next page, call this tool again with cursor. If null next_cursor, this means no more results.`);
      } catch (error: unknown) {
        if (error instanceof HotjarAuthenticationError) {
          return errorResponse(`Authentication Error: ${error.message}`);
        }

        if (error instanceof HotjarRateLimitError) {
          return errorResponse(`Rate Limit Error: ${error.message}. Resets at: ${error.resetAt.toISOString()}`);
        }

        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        return errorResponse(`Error fetching Hotjar survey responses: ${errorMessage}`);
      }
    }
  );

  return server;
}

export default createServer;
