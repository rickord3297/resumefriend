import { google } from "googleapis";
import { sentinelConfig, isGoogleConfigured } from "./config";

const SCOPES = [
  "https://www.googleapis.com/auth/gmail.readonly",
  "https://www.googleapis.com/auth/gmail.modify",
  "https://www.googleapis.com/auth/gmail.compose",
];

function getOAuth2Client() {
  const oauth2 = new google.auth.OAuth2(
    sentinelConfig.googleClientId,
    sentinelConfig.googleClientSecret,
    "urn:ietf:wg:oauth:2.0:oob"
  );
  oauth2.setCredentials({ refresh_token: sentinelConfig.googleRefreshToken });
  return oauth2;
}

export async function getGmailClient() {
  if (!isGoogleConfigured()) throw new Error("Google OAuth not configured");
  const auth = getOAuth2Client();
  return google.gmail({ version: "v1", auth });
}

/**
 * Start watching the user's mailbox (requires Pub/Sub topic).
 * Call this once during setup; then handle notifications at your webhook.
 */
export async function watchGmail(topicName: string): Promise<{ historyId: string; expiration: string }> {
  const gmail = await getGmailClient();
  const res = await gmail.users.watch({
    userId: "me",
    requestBody: {
      topicName,
      labelIds: ["INBOX"],
    },
  });
  return {
    historyId: String(res.data.historyId ?? ""),
    expiration: String(res.data.expiration ?? ""),
  };
}

/**
 * List history since a given historyId (for polling when not using Pub/Sub).
 * Returns new thread IDs and the new historyId to persist.
 */
export async function listHistorySince(
  startHistoryId: string
): Promise<{ threadIds: string[]; historyId: string }> {
  const gmail = await getGmailClient();
  const res = await gmail.users.history.list({
    userId: "me",
    startHistoryId,
    historyTypes: ["messageAdded"],
    maxResults: 50,
  });
  const threadIds = new Set<string>();
  for (const record of res.data.history ?? []) {
    for (const added of record.messagesAdded ?? []) {
      if (added.message?.threadId) threadIds.add(added.message.threadId);
    }
  }
  return {
    threadIds: Array.from(threadIds),
    historyId: String(res.data.historyId ?? startHistoryId),
  };
}

/**
 * Get the latest historyId (e.g. for initializing polling).
 */
export async function getCurrentHistoryId(): Promise<string> {
  const gmail = await getGmailClient();
  const profile = await gmail.users.getProfile({ userId: "me" });
  return String(profile.data.historyId ?? "0");
}

/**
 * Fetch thread and return the latest message snippet, from, subject for classification.
 */
export async function getThreadDetails(threadId: string): Promise<{
  threadId: string;
  messageId: string;
  snippet: string;
  from: string;
  subject: string;
} | null> {
  const gmail = await getGmailClient();
  const thread = await gmail.users.threads.get({
    userId: "me",
    id: threadId,
    format: "metadata",
    metadataHeaders: ["From", "Subject"],
  });
  const messages = thread.data.messages ?? [];
  const latest = messages[messages.length - 1];
  if (!latest) return null;
  const from = latest.payload?.headers?.find((h) => h.name === "From")?.value ?? "";
  const subject = latest.payload?.headers?.find((h) => h.name === "Subject")?.value ?? "";
  return {
    threadId,
    messageId: latest.id ?? "",
    snippet: latest.snippet ?? "",
    from,
    subject,
  };
}

/**
 * Create a draft reply in the given thread using the provided body (plain text).
 */
export async function createDraftReply(
  threadId: string,
  body: string,
  subject?: string
): Promise<string> {
  const gmail = await getGmailClient();
  const thread = await gmail.users.threads.get({
    userId: "me",
    id: threadId,
    format: "metadata",
    metadataHeaders: ["Subject", "Message-ID", "References"],
  });
  const messages = thread.data.messages ?? [];
  const latest = messages[messages.length - 1];
  const replyTo = latest?.payload?.headers?.find((h) => h.name === "Message-ID")?.value ?? "";
  const references = latest?.payload?.headers?.find((h) => h.name === "References")?.value ?? "";
  const subj = subject ?? thread.data.messages?.[0]?.payload?.headers?.find((h) => h.name === "Subject")?.value ?? "Re: Interview";
  const to = latest?.payload?.headers?.find((h) => h.name === "From")?.value ?? "";

  const raw = [
    `To: ${to}`,
    `Subject: ${subj.startsWith("Re:") ? subj : `Re: ${subj}`}`,
    references ? `References: ${references}` : "",
    replyTo ? `In-Reply-To: ${replyTo}` : "",
    "Content-Type: text/plain; charset=utf-8",
    "",
    body,
  ]
    .filter(Boolean)
    .join("\r\n");

  const encoded = Buffer.from(raw)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");

  const draft = await gmail.users.drafts.create({
    userId: "me",
    requestBody: {
      message: {
        threadId,
        raw: encoded,
      },
    },
  });
  return draft.data.id ?? "";
}
