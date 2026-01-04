import axios, {AxiosError} from "axios";
import {config} from "../../config/config.js";
import {
  HotjarCredentials,
  HotjarSurveyDetailsResult,
  HotjarSurveyResponseResult,
  HotjarSurveyResult
} from "./hotjar.service.types.js";
import {HotjarAuthenticationError, HotjarError, HotjarRateLimitError} from "./hotjar.service.errors.js";
import logger from "../../utils/logger.js";

export class HotjarService {
  private readonly apiBase: string;
  private readonly tokenCache = new Map<string, { token: string; expiresAt: number }>();

  constructor() {
    this.apiBase = config.hotjar.apiBase;
  }

  private async getToken(credentials: HotjarCredentials): Promise<string> {
    logger.info("Getting Hotjar token", {
      clientId: credentials.clientId,
      hasClientSecret: !!credentials.clientSecret
    });

    if (!credentials.clientId || !credentials.clientSecret) {
      logger.error("Hotjar credentials not provided");
      throw new HotjarAuthenticationError("Hotjar credentials not provided");
    }

    const cacheKey = credentials.clientId;
    const cached = this.tokenCache.get(cacheKey);
    if (cached && Date.now() < cached.expiresAt) {
      logger.info("Using cached token", { expiresAt: new Date(cached.expiresAt) });
      return cached.token;
    }

    try {
      logger.info("Requesting new token from Hotjar API");
      const response = await axios.post(`${this.apiBase}/oauth/token`, {
        grant_type: "client_credentials",
        client_id: credentials.clientId,
        client_secret: credentials.clientSecret,
      }, {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      });

      if (!response.data.access_token) {
        logger.error("No access token received from Hotjar API");
        throw new HotjarAuthenticationError("No access token received");
      }

      const TOKEN_EXPIRE_BUFFER_SECOND = 60;
      const expiresAt = Date.now() + (response.data.expires_in - TOKEN_EXPIRE_BUFFER_SECOND) * 1000;
      this.tokenCache.set(cacheKey, {
        token: response.data.access_token,
        expiresAt,
      });

      logger.info("Token obtained and cached", {
        expiresAt: new Date(expiresAt),
        expiresIn: response.data.expires_in
      });

      return response.data.access_token;
    } catch (error) {
      logger.error("Token request failed", {
        error: error instanceof Error ? error.message : 'Unknown error',
        status: axios.isAxiosError(error) ? error.response?.status : undefined
      });

      if (axios.isAxiosError(error)) {
        throw new HotjarAuthenticationError(`Authentication failed: ${error.response?.data?.error_description || error.message}`);
      }
      throw new HotjarAuthenticationError(`Authentication failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async makeRequest<T>(
    endpoint: string,
    params: Record<string, any> | undefined = {},
    credentials: HotjarCredentials
  ): Promise<T> {
    const startTime = Date.now();

    try {
      logger.info("Making Hotjar API request", { endpoint, params });
      const token = await this.getToken(credentials);

      const response = await axios.get(`${this.apiBase}${endpoint}`, {
        headers: {
          "Authorization": `Bearer ${token}`,
        },
        params,
      });

      const duration = Date.now() - startTime;
      logger.info("Hotjar API request successful", {
        endpoint,
        duration: `${duration}ms`,
        status: response.status
      });

      return response.data;
    } catch (error) {
      const duration = Date.now() - startTime;
      logger.error("Hotjar API request failed", {
        endpoint,
        duration: `${duration}ms`,
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError;

        if (axiosError.response?.status === 401) {
          logger.error("Authentication failed", { status: 401 });
          throw new HotjarAuthenticationError("Invalid credentials or token expired");
        }
        if (axiosError.response?.status === 429) {
          logger.error("Rate limit exceeded", { status: 429 });
          throw new HotjarRateLimitError("Rate limit exceeded", new Date(Date.now() + 60000));
        }

        logger.error("API request failed", {
          status: axiosError.response?.status,
          message: (axiosError.response?.data as any)?.message || axiosError.message
        });

        throw new HotjarError(
          `API request failed: ${(axiosError.response?.data as any)?.message || axiosError.message}`,
          axiosError.response?.status || 500,
          axiosError.response?.data
        );
      }

      throw new HotjarError(
        `Request failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        500,
        null
      );
    }
  }

  async getSurveys(
    credentials: HotjarCredentials,
    siteId: string,
    cursor?: string,
  ): Promise<HotjarSurveyResult> {
    logger.info("Getting surveys", { siteId, cursor });

    const response = await this.makeRequest<HotjarSurveyResult>(
      `/sites/${siteId}/surveys`,
      {
        limit: config.hotjar.apiLimit,
        cursor
      },
      credentials
    );

    logger.info("Surveys retrieved", {
      siteId,
      count: response.results.length,
      cursor,
    });
    return response;
  }

  async getSurveyDetails(
    credentials: HotjarCredentials,
    siteId: string,
    surveyId: string
  ): Promise<HotjarSurveyDetailsResult> {
    logger.info("Getting survey details", { siteId, surveyId });

    const response = await this.makeRequest<HotjarSurveyDetailsResult>(
      `/sites/${siteId}/surveys/${surveyId}`,
      undefined,
      credentials
    );

    logger.info("Survey details retrieved", { siteId, surveyId });
    return response;
  }

  async getSurveyResponses(
    credentials: HotjarCredentials,
    siteId: string,
    surveyId: string,
    cursor?: string,
  ): Promise<HotjarSurveyResponseResult> {
    logger.info("Getting survey responses", { siteId, surveyId, cursor });

    const response = await this.makeRequest<HotjarSurveyResponseResult>(
      `/sites/${siteId}/surveys/${surveyId}/responses`,
      {
        limit: config.hotjar.apiLimit,
        cursor
      },
      credentials
    );

    logger.info("Survey responses retrieved", {
      siteId,
      surveyId,
      count: response.results.length,
      cursor,
    });
    return response;
  }
}
