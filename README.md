# Hotjar MCP Server

A Model Context Protocol (MCP) server for [Hotjar](https://www.hotjar.com/) - the user behavior analytics and feedback collection tool. This server enables AI assistants to interact with Hotjar surveys through the MCP protocol.

## Features

- 🔌 **Dual Transport Support**: Works with both SSE (Server-Sent Events) and stdio transports
- 📊 **Survey Management**: Retrieve surveys for specific Hotjar sites
- 📝 **Survey Details**: Get detailed information for individual surveys
- 💬 **Survey Responses**: Fetch survey responses with pagination support
- 🔐 **Secure Authentication**: OAuth client credentials authentication with token caching
- ⚡ **Performance Optimized**: Built-in token caching for improved performance
- 🛡️ **Error Handling**: Comprehensive error handling for authentication and rate limits

## Configuration

### Authentication Setup

1. You need to get Hotjar OAuth credentials:
   - Log in to your Hotjar account
   - Navigate to **Settings → Integrations → API**
   - Create a new OAuth application or use existing credentials
   - Copy your **Client ID** and **Client Secret**

2. Configure environment variables:
   - `HOTJAR_CLIENT_ID`: Your Hotjar Client ID
   - `HOTJAR_CLIENT_SECRET`: Your Hotjar Client Secret
   - `HOTJAR_SITE_ID`: Your Hotjar site ID (optional, can be passed as parameter)
   - `HOTJAR_SURVEY_ID`: Your Hotjar survey ID (optional, can be passed as parameter)

3. Alternative: Pass credentials directly as tool parameters instead of using environment variables

### Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `HOTJAR_CLIENT_ID` | Optional* | Your Hotjar OAuth Client ID |
| `HOTJAR_CLIENT_SECRET` | Optional* | Your Hotjar OAuth Client Secret |
| `HOTJAR_SITE_ID` | Optional | Default Hotjar site ID |
| `HOTJAR_SURVEY_ID` | Optional | Default Hotjar survey ID |
| `PORT` | Optional | Server port (default: 3001, only for SSE mode) |
| `LOG_LEVEL` | Optional | Logging level: debug, info, warn, error (default: info) |
| `MCP_TRANSPORT` | Optional | Transport mode: "sse" or "stdio" (default: sse) |

*Credentials can be passed as tool parameters instead of environment variables.

## Usage

### Local Usage

1. Copy the example environment file and configure your credentials:

```bash
cp .env.example .env
```

2. Edit `.env` file with your Hotjar credentials:

```env
HOTJAR_CLIENT_ID=your_client_id
HOTJAR_CLIENT_SECRET=your_client_secret
HOTJAR_SITE_ID=your_site_id
```

3. Start the server:

```bash
npm start
```

The server will start on `http://localhost:3001` with the following endpoints:
- `GET /sse` - SSE connection endpoint
- `POST /messages?sessionId=<id>` - Message handling endpoint
- `GET /health` - Health check endpoint

### Deploy anywhere

You can also dockerize this application for deployment. Create your own Dockerfile and deploy as needed.

### Stdio Mode

For use with MCP clients that support stdio transport:

```bash
npm start -- --stdio
```

Or set the environment variable:

```bash
MCP_TRANSPORT=stdio npm start
```

### Client Configuration

#### Cursor IDE

Add to your Cursor settings (`.cursor/mcp.json`):

**SSE Mode:**
```json
{
  "mcpServers": {
    "hotjar": {
      "url": "http://localhost:3001/sse"
    }
  }
}
```

**Stdio Mode:**
```json
{
  "mcpServers": {
    "hotjar": {
      "command": "node",
      "args": ["/path/to/hotjar-mcp-server/build/index.js", "--stdio"],
      "env": {
        "HOTJAR_CLIENT_ID": "your_client_id",
        "HOTJAR_CLIENT_SECRET": "your_client_secret"
      }
    }
  }
}
```

#### Claude Desktop

Add to your Claude Desktop config (`claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "hotjar": {
      "command": "node",
      "args": ["/path/to/hotjar-mcp-server/build/index.js", "--stdio"],
      "env": {
        "HOTJAR_CLIENT_ID": "your_client_id",
        "HOTJAR_CLIENT_SECRET": "your_client_secret"
      }
    }
  }
}
```

## Tools

### getHotjarSurveys

Get surveys for a specific Hotjar site.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| `clientId` | string | Optional | Hotjar Client ID (uses env var if not provided) |
| `clientSecret` | string | Optional | Hotjar Client Secret (uses env var if not provided) |
| `siteId` | string | Optional | Hotjar site ID (uses env var if not provided) |
| `cursor` | string | Optional | Pagination cursor from previous response |

**Example:**
```json
{
  "siteId": "1234567"
}
```

### getHotjarSurveyDetails

Get detailed information for a specific Hotjar survey.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| `clientId` | string | Optional | Hotjar Client ID |
| `clientSecret` | string | Optional | Hotjar Client Secret |
| `siteId` | string | Optional | Hotjar site ID |
| `surveyId` | string | Required* | Hotjar survey ID |

**Example:**
```json
{
  "siteId": "1234567",
  "surveyId": "9876543"
}
```

### getHotjarSurveyResponses

Get responses for a specific Hotjar survey.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| `clientId` | string | Optional | Hotjar Client ID |
| `clientSecret` | string | Optional | Hotjar Client Secret |
| `siteId` | string | Optional | Hotjar site ID |
| `surveyId` | string | Required* | Hotjar survey ID |
| `cursor` | string | Optional | Pagination cursor from previous response |

**Example:**
```json
{
  "siteId": "1234567",
  "surveyId": "9876543",
  "cursor": null
}
```

## Pagination

Both `getHotjarSurveys` and `getHotjarSurveyResponses` support pagination:

- **First request**: Omit the `cursor` parameter or pass `null`
- **Subsequent requests**: Use the `next_cursor` value from the previous response
- **End of results**: When `next_cursor` is `null` in the response, there are no more results

## Error Handling

The server handles the following error types:

- **Authentication Errors**: Invalid or expired credentials
- **Rate Limit Errors**: Too many requests (includes reset time)
- **Validation Errors**: Missing required parameters
- **API Errors**: General Hotjar API errors

## License

MIT License - Copyright (c) 2026 Yasin Uysal - see [LICENSE](LICENSE) for details.

## Disclaimer

This project is not affiliated with, endorsed by, or sponsored by Hotjar Ltd. Users are responsible for complying with Hotjar's API Terms of Service and Terms of Service.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
