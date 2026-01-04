export class HotjarError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly response: unknown
  ) {
    super(message);
    this.name = "HotjarError";
  }
}

export class HotjarAuthenticationError extends HotjarError {
  constructor(message = "Authentication failed") {
    super(message, 401, { message });
    this.name = "HotjarAuthenticationError";
  }
}

export class HotjarRateLimitError extends HotjarError {
  constructor(
    message = "Rate limit exceeded",
    public readonly resetAt: Date
  ) {
    super(message, 429, { message, reset_at: resetAt.toISOString() });
    this.name = "HotjarRateLimitError";
  }
}
