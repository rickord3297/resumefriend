/**
 * Sentinel configuration from environment.
 * Required for Gmail + Calendar: Google OAuth2 credentials and tokens.
 */
export const sentinelConfig = {
  /** Google OAuth2 client ID (from Google Cloud Console) */
  get googleClientId(): string {
    return process.env.GOOGLE_CLIENT_ID ?? "";
  },
  get googleClientSecret(): string {
    return process.env.GOOGLE_CLIENT_SECRET ?? "";
  },
  /** Path to token file created by OAuth flow (or use GOOGLE_REFRESH_TOKEN in env) */
  get googleRefreshToken(): string {
    return process.env.GOOGLE_REFRESH_TOKEN ?? "";
  },
  /** OpenAI API key for email classification and reply generation */
  get openaiApiKey(): string {
    return process.env.OPENAI_API_KEY ?? "";
  },
  /** Gmail Pub/Sub topic for watch (optional; if not set, Sentinel uses polling) */
  get gmailWatchTopic(): string {
    return process.env.GMAIL_WATCH_TOPIC ?? "";
  },
  /** Path to persisted Gmail historyId for polling (optional) */
  get gmailHistoryIdPath(): string {
    return process.env.GMAIL_HISTORY_ID_PATH ?? "";
  },
};

export function isGoogleConfigured(): boolean {
  return !!(
    sentinelConfig.googleClientId &&
    sentinelConfig.googleClientSecret &&
    sentinelConfig.googleRefreshToken
  );
}

export function isOpenAIConfigured(): boolean {
  return !!sentinelConfig.openaiApiKey;
}
