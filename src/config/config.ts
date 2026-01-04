import dotenv from 'dotenv';

dotenv.config();

export const config = {
  port: process.env.PORT || 3001,
  mcp: {
    name: "hotjar-mcp-server",
    version: "1.0.0"
  },
  hotjar: {
    clientId: process.env.HOTJAR_CLIENT_ID,
    clientSecret: process.env.HOTJAR_CLIENT_SECRET,
    siteId: process.env.HOTJAR_SITE_ID,
    surveyId: process.env.HOTJAR_SURVEY_ID,
    apiBase: 'https://api.hotjar.io/v1',
    apiLimit: 100,
  },
};
