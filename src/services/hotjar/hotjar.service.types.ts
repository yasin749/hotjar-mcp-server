export type HotjarCredentials = {
  clientId?: string;
  clientSecret?: string;
};

export type HotjarSurveyResult = {
  results: Record<string, any>[];
  next_cursor?: string;
};

export type HotjarSurveyDetailsResult = Record<string, any>;

export type HotjarSurveyResponseResult = {
  results: Record<string, any>[];
  next_cursor?: string;
};
