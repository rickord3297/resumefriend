import { google } from "googleapis";
import { sentinelConfig, isGoogleConfigured } from "./config";
import { addPrepModeWindow } from "@/lib/dashboard-store";
import type { PrepModeWindow } from "@/types/sentinel";
import { randomUUID } from "crypto";

const SCOPES = ["https://www.googleapis.com/auth/calendar.readonly"];
const PREP_MINUTES = 30;
const INTERVIEW_KEYWORDS = ["interview", "phone screen", "technical", "onsite", "meeting with"];

function getOAuth2Client() {
  const oauth2 = new google.auth.OAuth2(
    sentinelConfig.googleClientId,
    sentinelConfig.googleClientSecret,
    "urn:ietf:wg:oauth:2.0:oob"
  );
  oauth2.setCredentials({ refresh_token: sentinelConfig.googleRefreshToken });
  return oauth2;
}

export async function getCalendarClient() {
  if (!isGoogleConfigured()) throw new Error("Google OAuth not configured");
  const auth = getOAuth2Client();
  return google.calendar({ version: "v3", auth });
}

/**
 * Fetch events from the primary calendar and detect "Interview" events.
 * For each, create a Prep Mode window 30 minutes prior and persist to dashboard state.
 */
export async function syncInterviewPrepWindows(): Promise<PrepModeWindow[]> {
  const calendar = await getCalendarClient();
  const now = new Date();
  const future = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days ahead

  const res = await calendar.events.list({
    calendarId: "primary",
    timeMin: now.toISOString(),
    timeMax: future.toISOString(),
    singleEvents: true,
    orderBy: "startTime",
  });

  const added: PrepModeWindow[] = [];
  for (const event of res.data.items ?? []) {
    const title = (event.summary ?? "").toLowerCase();
    const isInterview = INTERVIEW_KEYWORDS.some((k) => title.includes(k));
    if (!isInterview) continue;

    const start = event.start?.dateTime ?? event.start?.date;
    if (!start) continue;

    const eventStart = new Date(start);
    const prepStart = new Date(eventStart.getTime() - PREP_MINUTES * 60 * 1000);

    const window: PrepModeWindow = {
      id: randomUUID(),
      calendarEventId: event.id ?? randomUUID(),
      eventTitle: event.summary ?? "Interview",
      eventStart: eventStart.toISOString(),
      prepStart: prepStart.toISOString(),
      prepEnd: eventStart.toISOString(),
    };
    await addPrepModeWindow(window);
    added.push(window);
  }
  return added;
}
