import { readFile, writeFile, mkdir } from "fs/promises";
import path from "path";
import type {
  JobApplication,
  Communication,
  Interview,
  ActivityItem,
  PerformanceMetrics,
} from "@/types/analytics";

const DATA_DIR = path.join(process.cwd(), "data");
const APPLICATIONS_FILE = path.join(DATA_DIR, "applications.json");
const COMMUNICATIONS_FILE = path.join(DATA_DIR, "communications.json");
const INTERVIEWS_FILE = path.join(DATA_DIR, "interviews.json");
const ACTIVITY_FILE = path.join(DATA_DIR, "activity.json");

const DAY_MS = 24 * 60 * 60 * 1000;

async function ensureDir() {
  await mkdir(DATA_DIR, { recursive: true });
}

async function readJson<T>(file: string, defaultVal: T): Promise<T> {
  try {
    const raw = await readFile(file, "utf-8");
    return JSON.parse(raw) as T;
  } catch {
    return defaultVal;
  }
}

async function writeJson<T>(file: string, data: T) {
  await ensureDir();
  await writeFile(file, JSON.stringify(data, null, 2), "utf-8");
}

export async function getApplications(): Promise<JobApplication[]> {
  return readJson(APPLICATIONS_FILE, []);
}

export async function getCommunications(): Promise<Communication[]> {
  return readJson(COMMUNICATIONS_FILE, []);
}

export async function getInterviews(): Promise<Interview[]> {
  return readJson(INTERVIEWS_FILE, []);
}

export async function getActivity(limit = 20): Promise<ActivityItem[]> {
  const items = await readJson<ActivityItem[]>(ACTIVITY_FILE, []);
  return items.slice(0, limit);
}

export async function addApplication(app: Omit<JobApplication, "id">): Promise<JobApplication> {
  const apps = await getApplications();
  const id = `app_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
  const newApp: JobApplication = { ...app, id };
  apps.push(newApp);
  await writeJson(APPLICATIONS_FILE, apps);
  return newApp;
}

export async function addCommunication(c: Omit<Communication, "id">): Promise<Communication> {
  const comms = await getCommunications();
  const id = `comm_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
  const newC: Communication = { ...c, id };
  comms.push(newC);
  await writeJson(COMMUNICATIONS_FILE, comms);
  return newC;
}

export async function upsertInterview(interview: Interview): Promise<void> {
  const list = await getInterviews();
  const idx = list.findIndex((i) => i.id === interview.id || i.calendarEventId === interview.calendarEventId);
  const next = { ...interview };
  if (idx >= 0) list[idx] = next;
  else list.push(next);
  await writeJson(INTERVIEWS_FILE, list);
}

export async function setInterviewOutcome(interviewId: string, pm_score: 1 | 2 | 3): Promise<void> {
  const list = await getInterviews();
  const i = list.find((x) => x.id === interviewId || x.calendarEventId === interviewId);
  if (i) {
    i.pm_score = pm_score;
    i.pmRecordedAt = new Date().toISOString();
    await writeJson(INTERVIEWS_FILE, list);
  }
}

export async function addActivity(item: Omit<ActivityItem, "id">): Promise<void> {
  const items = await readJson<ActivityItem[]>(ACTIVITY_FILE, []);
  const id = `act_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
  items.unshift({ ...item, id });
  await writeJson(ACTIVITY_FILE, items.slice(0, 200));
}

export function computeMetrics(
  applications: JobApplication[],
  communications: Communication[],
  interviews: Interview[]
): PerformanceMetrics {
  const total = applications.length;
  const withResponse = new Set(
    communications.filter((c) => c.type === "interview_invitation").map((c) => c.applicationId)
  ).size;
  const now = Date.now();
  const ghosted = applications.filter((a) => {
    const applied = new Date(a.appliedAt).getTime();
    if (now - applied < 14 * DAY_MS) return false;
    const hasComms = communications.some((c) => c.applicationId === a.id);
    return !hasComms;
  }).length;
  const everInterview = applications.filter((a) => a.status === "interview" || a.status === "offer").length;
  const offers = applications.filter((a) => a.status === "offer").length;

  const responseRate = total > 0 ? Math.round((withResponse / total) * 100) : 0;
  const ghostingRate = total > 0 ? Math.round((ghosted / total) * 100) : 0;
  const interviewToOfferRate = everInterview > 0 ? Math.round((offers / everInterview) * 100) : 0;
  const withPm = interviews.filter((i) => i.pm_score != null).length;
  const nailedOrAvg = interviews.filter((i) => i.pm_score === 3 || i.pm_score === 2).length;
  const interviewSuccessRate = withPm > 0 ? Math.round((nailedOrAvg / withPm) * 100) : interviewToOfferRate;
  const marketAlignment = 75; // stub: compare salary_target to landed roles

  return {
    totalApplications: total,
    responseRate,
    ghostingRate,
    interviewToOfferRate,
    interviewSuccessRate,
    marketAlignment,
    responseRateTrend: "flat",
    interviewSuccessTrend: "flat",
    marketAlignmentTrend: "flat",
  };
}
